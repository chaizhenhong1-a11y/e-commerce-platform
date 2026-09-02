import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../account/domain/customer_address.dart';
import '../../account/presentation/address_book_providers.dart';
import '../../auth/presentation/auth_providers.dart';
import '../../cart/domain/customer_cart.dart';
import '../../cart/presentation/cart_providers.dart';
import '../../orders/presentation/order_providers.dart';
import '../domain/checkout_order.dart';
import 'checkout_providers.dart';

class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({super.key});

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _line1 = TextEditingController();
  final _line2 = TextEditingController();
  final _city = TextEditingController();
  final _state = TextEditingController();
  final _postcode = TextEditingController();
  final _couponCode = TextEditingController();

  String? _selectedAddressId;
  String _provider = kDebugMode ? 'MANUAL_TEST' : 'STRIPE';
  bool _initialized = false;
  bool _submitting = false;
  bool _refreshingInventory = false;
  bool _couponBusy = false;
  CouponValidation? _coupon;
  AutomaticPromotionPreview? _automaticPromotion;
  String? _promotionSessionId;
  String? _couponError;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _fullName.dispose();
    _phone.dispose();
    _line1.dispose();
    _line2.dispose();
    _city.dispose();
    _state.dispose();
    _postcode.dispose();
    _couponCode.dispose();
    super.dispose();
  }

  void _initialize() {
    if (_initialized) return;
    _initialized = true;

    final user = ref.read(authControllerProvider).user;
    if (user != null) {
      _email.text = user.email;
      _fullName.text = user.displayName;
    }
  }

  void _applyAddress(CustomerAddress address) {
    setState(() {
      _selectedAddressId = address.id;
      _fullName.text = address.recipientName;
      _phone.text = address.phone;
      _line1.text = address.line1;
      _line2.text = address.line2 ?? '';
      _city.text = address.city;
      _state.text = address.state;
      _postcode.text = address.postcode;
    });
  }

  Future<void> _loadAutomaticPromotion(CustomerCart cart) async {
    if (_promotionSessionId == cart.sessionId) return;
    _promotionSessionId = cart.sessionId;
    try {
      final promotion = await ref.read(checkoutRepositoryProvider).previewAutomaticPromotion(
            sessionId: cart.sessionId,
          );
      if (mounted) setState(() => _automaticPromotion = promotion);
    } catch (_) {
      if (mounted) setState(() => _automaticPromotion = null);
    }
  }

  Future<void> _applyCoupon(CustomerCart cart) async {
    if (_couponBusy || _couponCode.text.trim().isEmpty) return;
    setState(() {
      _couponBusy = true;
      _couponError = null;
    });
    try {
      final result = await ref.read(checkoutRepositoryProvider).validateCoupon(
            sessionId: cart.sessionId,
            couponCode: _couponCode.text.trim(),
          );
      if (!mounted) return;
      setState(() {
        _coupon = result;
        _couponCode.text = result.code;
      });
    } on DioException catch (error) {
      if (!mounted) return;
      setState(() {
        _coupon = null;
        _couponError = _messageFrom(error, 'Coupon could not be applied.');
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _coupon = null;
        _couponError = 'Coupon could not be applied.';
      });
    } finally {
      if (mounted) setState(() => _couponBusy = false);
    }
  }

  Future<void> _refreshInventoryState() async {
    if (_refreshingInventory) return;

    setState(() {
      _refreshingInventory = true;
      _error = null;
    });

    try {
      ref.invalidate(customerCartProvider);
      final latestCart = await ref.read(customerCartProvider.future);

      // Inventory changes can also change the winning automatic promotion.
      _promotionSessionId = null;
      await _loadAutomaticPromotion(latestCart);

      if (_coupon != null) {
        try {
          final refreshedCoupon = await ref
              .read(checkoutRepositoryProvider)
              .validateCoupon(
                sessionId: latestCart.sessionId,
                couponCode: _coupon!.code,
              );
          if (mounted) {
            setState(() {
              _coupon = refreshedCoupon;
              _couponCode.text = refreshedCoupon.code;
              _couponError = null;
            });
          }
        } on DioException catch (error) {
          if (mounted) {
            setState(() {
              _coupon = null;
              _couponError = _messageFrom(
                error,
                'Coupon is no longer valid for the refreshed cart.',
              );
            });
          }
        }
      }

      if (mounted && latestCart.canCheckout) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('Stock refreshed. Your cart is ready to checkout.'),
            ),
          );
      }
    } on DioException catch (error) {
      if (mounted) {
        setState(() {
          _error = _messageFrom(error, 'Unable to refresh stock.');
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Unable to refresh stock.';
        });
      }
    } finally {
      if (mounted) setState(() => _refreshingInventory = false);
    }
  }

  Future<void> _submit(CustomerCart cart) async {
    if (_submitting || !_formKey.currentState!.validate()) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    CheckoutOrder? createdOrder;
    try {
      // Re-read the account cart immediately before order creation so the
      // review screen cannot submit a stale inventory snapshot. The backend
      // remains authoritative and performs the final Serializable check.
      ref.invalidate(customerCartProvider);
      final checkoutCart = await ref.read(customerCartProvider.future);
      if (!checkoutCart.canCheckout) {
        setState(() {
          _error =
              'Your cart changed while you were checking out. Review the latest stock before continuing.';
          _submitting = false;
        });
        return;
      }

      final repository = ref.read(checkoutRepositoryProvider);
      createdOrder = await repository.createOrder(
        CheckoutInput(
          sessionId: checkoutCart.sessionId,
          email: _email.text,
          fullName: _fullName.text,
          phone: _phone.text,
          addressLine1: _line1.text,
          addressLine2: _line2.text,
          city: _city.text,
          state: _state.text,
          postcode: _postcode.text,
          couponCode: _coupon?.code,
        ),
      );

      // From this point onward the order already exists and owns the
      // 30-minute reservation. Never submit Checkout again to recover a
      // payment failure; recovery belongs to the order details screen.
      ref.invalidate(customerCartProvider);
      ref.invalidate(customerOrdersProvider);

      final payment = await repository.createPayment(
        orderNumber: createdOrder.orderNumber,
        provider: _provider,
      );
      _verifyPaymentAmount(createdOrder, payment);

      if (payment.status == 'PAID') {
        if (!mounted) return;
        await _showCompleted(createdOrder);
        return;
      }

      if (payment.provider == 'MANUAL_TEST') {
        await repository.confirmDevelopmentPayment(payment.id);
        ref.invalidate(customerOrdersProvider);
        if (!mounted) return;
        await _showCompleted(createdOrder);
        return;
      }

      final url = payment.checkoutUrl;
      if (url == null || url.isEmpty) {
        throw StateError('Payment provider did not return a checkout URL.');
      }

      final launched = await launchUrl(
        Uri.parse(url),
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw StateError('Unable to open the payment page.');
      }

      if (!mounted) return;
      // Order details observes app resume and refreshes the trusted payment
      // state after the customer returns from Stripe.
      context.go('/orders/${createdOrder.orderNumber}');
    } on DioException catch (error) {
      if (!mounted) return;
      if (createdOrder != null) {
        await _showPaymentRecovery(
          createdOrder,
          _messageFrom(error, 'Payment could not be started.'),
        );
        return;
      }
      setState(() {
        _error = _messageFrom(error, 'Checkout could not be completed.');
        _submitting = false;
      });
    } catch (error) {
      if (!mounted) return;
      final message = error is StateError
          ? error.message
          : 'Checkout could not be completed.';
      if (createdOrder != null) {
        await _showPaymentRecovery(createdOrder, message);
        return;
      }
      setState(() {
        _error = message;
        _submitting = false;
      });
    }
  }

  void _verifyPaymentAmount(CheckoutOrder order, PaymentSession payment) {
    if (payment.currency != order.currency ||
        payment.amountCents != order.totalCents) {
      throw StateError(
        'Payment amount does not match the server-confirmed order total. '
        'Open the order to retry safely.',
      );
    }
  }

  Future<void> _showPaymentRecovery(
    CheckoutOrder order,
    String message,
  ) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        icon: const Icon(Icons.payment_rounded, size: 44),
        title: const Text('Order created — payment pending'),
        content: Text(
          '$message\n\nOrder ${order.orderNumber} is already reserved. '
          'Continue payment from Order details instead of placing another order.',
          textAlign: TextAlign.center,
        ),
        actions: <Widget>[
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Open order'),
          ),
        ],
      ),
    );
    if (mounted) {
      context.go('/orders/${order.orderNumber}');
    }
  }

  Future<void> _showCompleted(CheckoutOrder order) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.check_circle_outline_rounded, size: 48),
        title: const Text('Payment completed'),
        content: Text(
          'Order ${order.orderNumber} has been confirmed.',
          textAlign: TextAlign.center,
        ),
        actions: <Widget>[
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('View orders'),
          ),
        ],
      ),
    );

    if (mounted) {
      context.go('/orders');
    }
  }

  @override
  Widget build(BuildContext context) {
    _initialize();

    final cart = ref.watch(customerCartProvider);
    final auth = ref.watch(authControllerProvider);
    final addresses = auth.isAuthenticated
        ? ref.watch(customerAddressesProvider)
        : const AsyncValue<List<CustomerAddress>>.data(
            <CustomerAddress>[],
          );

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: cart.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(_messageFrom(error, 'Unable to load cart.')),
          ),
        ),
        data: (value) {
          if (_promotionSessionId != value.sessionId) {
            WidgetsBinding.instance.addPostFrameCallback((_) => _loadAutomaticPromotion(value));
          }
          if (value.items.isEmpty) {
            return const Center(child: Text('Your cart is empty.'));
          }

          if (!value.canCheckout) {
            return _CheckoutBlocked(
              issueCount: value.issueCount,
              refreshing: _refreshingInventory,
              onRefreshStock: _refreshInventoryState,
              onReviewCart: () => context.go('/cart'),
            );
          }

          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 36),
              children: <Widget>[
                _SectionCard(
                  title: 'Contact',
                  child: Column(
                    children: <Widget>[
                      _field(
                        _email,
                        'Email',
                        keyboardType: TextInputType.emailAddress,
                        validator: _emailValidator,
                      ),
                      _field(_fullName, 'Full name'),
                      _field(
                        _phone,
                        'Phone',
                        keyboardType: TextInputType.phone,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                if (auth.isAuthenticated)
                  addresses.when(
                    loading: () => const _SectionCard(
                      title: 'Saved address',
                      child: LinearProgressIndicator(),
                    ),
                    error: (error, stackTrace) => _SectionCard(
                      title: 'Saved address',
                      child: Text(
                        'Saved addresses are unavailable. You can still '
                        'enter delivery details manually.',
                        style: TextStyle(
                          color:
                              Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                    data: (items) {
                      if (items.isNotEmpty &&
                          _selectedAddressId == null) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (!mounted || _selectedAddressId != null) return;
                          final preferred = items.where(
                            (item) => item.isDefault,
                          );
                          _applyAddress(
                            preferred.isNotEmpty
                                ? preferred.first
                                : items.first,
                          );
                        });
                      }

                      return _SavedAddressPicker(
                        addresses: items,
                        selectedId: _selectedAddressId,
                        onSelected: _applyAddress,
                        onManage: () => context.push('/addresses'),
                      );
                    },
                  ),
                if (auth.isAuthenticated) const SizedBox(height: 14),
                _SectionCard(
                  title: 'Delivery address',
                  child: Column(
                    children: <Widget>[
                      _field(_line1, 'Address line 1'),
                      _field(
                        _line2,
                        'Address line 2',
                        required: false,
                      ),
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: _field(_postcode, 'Postcode'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: _field(_city, 'City')),
                        ],
                      ),
                      _field(_state, 'State'),
                      TextFormField(
                        initialValue: 'Malaysia',
                        enabled: false,
                        decoration:
                            const InputDecoration(labelText: 'Country'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _SectionCard(
                  title: 'Shipping',
                  child: const ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.local_shipping_outlined),
                    title: Text('Standard delivery'),
                    subtitle: Text(
                      'RM 10.00 · Free for orders RM 150.00 and above',
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                if (_automaticPromotion != null) ...<Widget>[
                  _SectionCard(
                    title: 'Automatic promotion',
                    child: Text(
                      '${_automaticPromotion!.name} · RM ${_automaticPromotion!.discount.toStringAsFixed(2)} off\nApplied automatically — no coupon code required.',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
                _SectionCard(
                  title: 'Coupon',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: TextField(
                              controller: _couponCode,
                              textCapitalization: TextCapitalization.characters,
                              enabled: !_couponBusy,
                              decoration: const InputDecoration(
                                labelText: 'Coupon code',
                                hintText: 'WELCOME10',
                              ),
                              onChanged: (_) {
                                if (_coupon != null) {
                                  setState(() => _coupon = null);
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          FilledButton.tonal(
                            onPressed: _couponBusy
                                ? null
                                : _coupon != null
                                    ? () => setState(() {
                                          _coupon = null;
                                          _couponCode.clear();
                                          _couponError = null;
                                        })
                                    : () => _applyCoupon(value),
                            child: Text(
                              _couponBusy
                                  ? 'Checking…'
                                  : _coupon != null
                                      ? 'Remove'
                                      : 'Apply',
                            ),
                          ),
                        ],
                      ),
                      if (_coupon != null) ...<Widget>[
                        const SizedBox(height: 8),
                        Text(
                          '${_coupon!.code} applied · RM ${_coupon!.discount.toStringAsFixed(2)} off',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                      if (_couponError != null) ...<Widget>[
                        const SizedBox(height: 8),
                        Text(
                          _couponError!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _SectionCard(
                  title: 'Payment',
                  child: RadioGroup<String>(
                    groupValue: _provider,
                    onChanged: (value) {
                      if (_submitting || value == null) return;
                      setState(() => _provider = value);
                    },
                    child: Column(
                      children: <Widget>[
                        if (kDebugMode)
                          const RadioListTile<String>(
                            contentPadding: EdgeInsets.zero,
                            value: 'MANUAL_TEST',
                            title: Text('Development test payment'),
                            subtitle: Text(
                              'Local testing only; confirms immediately.',
                            ),
                          ),
                        const RadioListTile<String>(
                          contentPadding: EdgeInsets.zero,
                          value: 'STRIPE',
                          title: Text('Stripe'),
                          subtitle: Text(
                            'Secure hosted payment page.',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                _OrderSummary(cart: value, coupon: _coupon, automaticPromotion: _automaticPromotion),
                if (_error != null) ...<Widget>[
                  const SizedBox(height: 14),
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
                const SizedBox(height: 22),
                FilledButton.icon(
                  onPressed: _submitting || !value.canCheckout
                      ? null
                      : () => _submit(value),
                  icon: const Icon(Icons.lock_outline_rounded),
                  label: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Text(
                      _submitting
                          ? 'Processing…'
                          : _provider == 'MANUAL_TEST'
                              ? 'Place order & complete test payment'
                              : 'Continue to secure payment',
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Placing the order reserves inventory for 30 minutes '
                  'while payment is pending.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = true,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label),
        validator: validator ??
            (value) {
              if (!required) return null;
              if (value == null || value.trim().isEmpty) {
                return '$label is required.';
              }
              return null;
            },
      ),
    );
  }

  String? _emailValidator(String? value) {
    final email = value?.trim() ?? '';
    if (email.isEmpty) return 'Email is required.';
    if (!email.contains('@') || !email.contains('.')) {
      return 'Enter a valid email.';
    }
    return null;
  }
}

class _CheckoutBlocked extends StatelessWidget {
  const _CheckoutBlocked({
    required this.issueCount,
    required this.refreshing,
    required this.onRefreshStock,
    required this.onReviewCart,
  });

  final int issueCount;
  final bool refreshing;
  final VoidCallback onRefreshStock;
  final VoidCallback onReviewCart;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(
                Icons.error_outline_rounded,
                size: 54,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Review your cart before checkout',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 10),
              Text(
                '$issueCount item${issueCount == 1 ? '' : 's'} changed '
                'since you added them. Resolve stock or availability '
                'issues first.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 22),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 10,
                runSpacing: 10,
                children: <Widget>[
                  OutlinedButton.icon(
                    onPressed: refreshing ? null : onRefreshStock,
                    icon: refreshing
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.refresh_rounded),
                    label: Text(refreshing ? 'Refreshing…' : 'Refresh stock'),
                  ),
                  FilledButton.icon(
                    onPressed: onReviewCart,
                    icon: const Icon(Icons.shopping_cart_outlined),
                    label: const Text('Review cart'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CheckoutImageFallback extends StatelessWidget {
  const _CheckoutImageFallback();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: const Center(
        child: Icon(Icons.inventory_2_outlined, size: 22),
      ),
    );
  }
}

class _SavedAddressPicker extends StatelessWidget {
  const _SavedAddressPicker({
    required this.addresses,
    required this.selectedId,
    required this.onSelected,
    required this.onManage,
  });

  final List<CustomerAddress> addresses;
  final String? selectedId;
  final ValueChanged<CustomerAddress> onSelected;
  final VoidCallback onManage;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Saved address',
      child: addresses.isEmpty
          ? Row(
              children: <Widget>[
                const Expanded(
                  child: Text('No saved addresses yet.'),
                ),
                TextButton(
                  onPressed: onManage,
                  child: const Text('Add'),
                ),
              ],
            )
          : RadioGroup<String>(
              groupValue: selectedId,
              onChanged: (value) {
                if (value == null) return;
                final address = addresses.firstWhere(
                  (item) => item.id == value,
                );
                onSelected(address);
              },
              child: Column(
                children: <Widget>[
                  ...addresses.map(
                    (address) => RadioListTile<String>(
                      contentPadding: EdgeInsets.zero,
                      value: address.id,
                      title: Text(
                        address.isDefault
                            ? '${address.label} · Default'
                            : address.label,
                      ),
                      subtitle: Text(
                        '${address.recipientName}\n'
                        '${address.line1}, ${address.postcode} ${address.city}',
                      ),
                    ),
                  ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: onManage,
                      child: const Text('Manage addresses'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _OrderSummary extends StatelessWidget {
  const _OrderSummary({required this.cart, this.coupon, this.automaticPromotion});

  final CustomerCart cart;
  final CouponValidation? coupon;
  final AutomaticPromotionPreview? automaticPromotion;

  @override
  Widget build(BuildContext context) {
    final shipping = cart.subtotal >= 150 ? 0.0 : 10.0;
    final couponWins = coupon != null &&
        (automaticPromotion == null || coupon!.discountCents >= automaticPromotion!.discountCents);
    final discount = couponWins ? coupon!.discount : automaticPromotion?.discount ?? 0.0;
    final total = (cart.subtotal + shipping - discount).clamp(0.0, double.infinity);

    return _SectionCard(
      title: 'Order review',
      child: Column(
        children: <Widget>[
          ...cart.items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: SizedBox(
                      width: 54,
                      height: 54,
                      child: item.imageUrl != null &&
                              item.imageUrl!.isNotEmpty
                          ? Image.network(
                              item.imageUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const _CheckoutImageFallback(),
                            )
                          : const _CheckoutImageFallback(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          item.productName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${item.variantName} · ${item.sku} · '
                          'Qty ${item.quantity}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'RM ${item.lineTotal.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 24),
          _row('Subtotal', 'RM ${cart.subtotal.toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          _row(
            'Shipping',
            shipping == 0 ? 'FREE' : 'RM ${shipping.toStringAsFixed(2)}',
          ),
          if (discount > 0) ...<Widget>[
            const SizedBox(height: 8),
            _row(
              couponWins ? 'Discount (${coupon!.code})' : 'Automatic promotion (${automaticPromotion!.name})',
              '- RM ${discount.toStringAsFixed(2)}',
            ),
          ],
          const Divider(height: 26),
          _row(
            'Total',
            'RM ${total.toStringAsFixed(2)}',
            bold: true,
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value, {bool bold = false}) {
    final style = TextStyle(
      fontWeight: bold ? FontWeight.w900 : FontWeight.w500,
      fontSize: bold ? 17 : 14,
    );
    return Row(
      children: <Widget>[
        Expanded(child: Text(label, style: style)),
        Text(value, style: style),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}

String _messageFrom(Object error, String fallback) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
    }
  }
  return fallback;
}
