import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/presentation/auth_providers.dart';
import '../domain/customer_cart.dart';
import 'cart_providers.dart';

const Color _elvaneInk = Color(0xFF171717);
const Color _elvaneAccent = Color(0xFFDBFF4B);
const Color _elvaneMuted = Color(0xFF70706B);
const Color _elvaneBorder = Color(0xFFE5E5DF);
const Color _elvaneSoft = Color(0xFFF1F1EC);

class CartPage extends ConsumerWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cart')),
        body: const _SignedOutCart(),
      );
    }

    final cart = ref.watch(customerCartProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cart'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => ref.invalidate(customerCartProvider),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(customerCartProvider.future),
        child: cart.when(
          loading: () => const _CartLoading(),
          error: (error, stackTrace) => _CartError(
            message: _messageFrom(error, 'Unable to load cart.'),
            onRetry: () => ref.invalidate(customerCartProvider),
          ),
          data: (value) => value.items.isEmpty
              ? const _EmptyCart()
              : _CartContent(cart: value),
        ),
      ),
    );
  }
}

class _SignedOutCart extends StatelessWidget {
  const _SignedOutCart();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: _elvaneBorder),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Container(
                  width: 68,
                  height: 68,
                  decoration: const BoxDecoration(
                    color: _elvaneAccent,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.shopping_bag_outlined,
                    color: _elvaneInk,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Your bag follows you',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _elvaneInk,
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in to keep your cart private and synced across Elvane.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _elvaneMuted,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: _elvaneInk,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: () => context.push('/sign-in?returnTo=%2Fcart'),
                    child: const Text(
                      'Sign in to continue',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CartContent extends ConsumerWidget {
  const _CartContent({required this.cart});

  final CustomerCart cart;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 36),
      children: <Widget>[
        _CartHero(cart: cart),
        const SizedBox(height: 22),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: <Widget>[
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'IN YOUR BAG',
                    style: TextStyle(
                      color: _elvaneMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.3,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Ready when you are.',
                    style: TextStyle(
                      color: _elvaneInk,
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.4,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '${cart.items.length} line${cart.items.length == 1 ? '' : 's'}',
              style: const TextStyle(
                color: _elvaneMuted,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...cart.items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _CartItemCard(item: item),
          ),
        ),
        if (cart.issueCount > 0) ...<Widget>[
          const SizedBox(height: 4),
          _AttentionBanner(issueCount: cart.issueCount),
        ],
        const SizedBox(height: 10),
        _OrderSummary(cart: cart),
      ],
    );
  }
}

class _CartHero extends StatelessWidget {
  const _CartHero({required this.cart});

  final CustomerCart cart;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: _elvaneInk,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Stack(
        children: <Widget>[
          Positioned(
            right: -16,
            top: -28,
            child: Container(
              width: 108,
              height: 108,
              decoration: const BoxDecoration(
                color: _elvaneAccent,
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: 22,
            bottom: -26,
            child: Transform.rotate(
              angle: -0.14,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  border: Border.all(color: _elvaneAccent, width: 3),
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text(
                'ELVANE BAG',
                style: TextStyle(
                  color: _elvaneAccent,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                '${cart.totalQuantity} item${cart.totalQuantity == 1 ? '' : 's'} saved',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 27,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.8,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Review sizes, stock and quantities before checkout.',
                style: TextStyle(
                  color: Color(0xFFC8C8C2),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 22),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
                decoration: BoxDecoration(
                  color: _elvaneAccent,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'RM ${cart.subtotal.toStringAsFixed(2)} subtotal',
                  style: const TextStyle(
                    color: _elvaneInk,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AttentionBanner extends StatelessWidget {
  const _AttentionBanner({required this.issueCount});

  final int issueCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(
            Icons.error_outline_rounded,
            color: Theme.of(context).colorScheme.onErrorContainer,
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              '$issueCount item${issueCount == 1 ? '' : 's'} need attention before checkout. Fix the highlighted stock issue first.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onErrorContainer,
                fontWeight: FontWeight.w700,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderSummary extends StatelessWidget {
  const _OrderSummary({required this.cart});

  final CustomerCart cart;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: _elvaneBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'ORDER SUMMARY',
            style: TextStyle(
              color: _elvaneMuted,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 16),
          _SummaryRow(
            label:
                'Subtotal · ${cart.totalQuantity} item${cart.totalQuantity == 1 ? '' : 's'}',
            value: 'RM ${cart.subtotal.toStringAsFixed(2)}',
          ),
          const SizedBox(height: 11),
          const _SummaryRow(
            label: 'Delivery',
            value: 'Calculated at checkout',
            compactValue: true,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 17),
            child: Divider(height: 1, color: _elvaneBorder),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'ESTIMATED TOTAL',
                      style: TextStyle(
                        color: _elvaneMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.1,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Taxes and discounts confirmed next.',
                      style: TextStyle(
                        color: _elvaneMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 18),
              Text(
                'RM ${cart.subtotal.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: _elvaneInk,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor:
                    cart.canCheckout ? _elvaneInk : _elvaneSoft,
                foregroundColor:
                    cart.canCheckout ? Colors.white : _elvaneMuted,
                disabledBackgroundColor: _elvaneSoft,
                disabledForegroundColor: _elvaneMuted,
                padding: const EdgeInsets.symmetric(vertical: 17),
              ),
              onPressed:
                  cart.canCheckout ? () => context.push('/checkout') : null,
              icon: const Icon(Icons.arrow_forward_rounded),
              label: const Text(
                'Continue to checkout',
                style: TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
          if (!cart.canCheckout) ...<Widget>[
            const SizedBox(height: 10),
            const Text(
              'Checkout unlocks after every cart item is available.',
              style: TextStyle(
                color: _elvaneMuted,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.compactValue = false,
  });

  final String label;
  final String value;
  final bool compactValue;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: _elvaneMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(width: 18),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              color: _elvaneInk,
              fontSize: compactValue ? 12 : 15,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ],
    );
  }
}

class _CartItemCard extends ConsumerStatefulWidget {
  const _CartItemCard({required this.item});

  final CustomerCartItem item;

  @override
  ConsumerState<_CartItemCard> createState() => _CartItemCardState();
}

class _CartItemCardState extends ConsumerState<_CartItemCard> {
  bool _busy = false;

  Future<void> _update(int quantity) async {
    if (_busy || quantity < 1) {
      return;
    }

    final item = widget.item;
    final maxQuantity = item.availableStock.clamp(0, 99);
    if (!item.productActive ||
        !item.variantActive ||
        maxQuantity <= 0 ||
        quantity > maxQuantity) {
      _showMessage(
        maxQuantity <= 0
            ? 'This item is out of stock.'
            : 'Only $maxQuantity available.',
      );
      await _refreshCart();
      return;
    }

    setState(() => _busy = true);
    try {
      await ref
          .read(cartRepositoryProvider)
          .updateItem(widget.item.id, quantity);
      await _refreshCart();
    } on DioException catch (error) {
      await _refreshCart();
      if (mounted) {
        _showMessage(_messageFrom(error, 'Unable to update cart.'));
      }
    } catch (_) {
      await _refreshCart();
      if (mounted) {
        _showMessage('Unable to update cart.');
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _remove() async {
    if (_busy) {
      return;
    }

    setState(() => _busy = true);
    try {
      await ref.read(cartRepositoryProvider).removeItem(widget.item.id);
      await _refreshCart();
    } on DioException catch (error) {
      await _refreshCart();
      if (mounted) {
        _showMessage(_messageFrom(error, 'Unable to remove item.'));
      }
    } catch (_) {
      await _refreshCart();
      if (mounted) {
        _showMessage('Unable to remove item.');
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _refreshCart() async {
    ref.invalidate(customerCartProvider);
    try {
      await ref.read(customerCartProvider.future);
    } catch (_) {
      // The page-level cart error state will surface refresh failures.
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final hasIssue = item.issue != null;
    final isLowStock = item.issue == null && item.availableStock <= 5;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color:
              hasIssue ? Theme.of(context).colorScheme.error : _elvaneBorder,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: SizedBox(
              width: 92,
              height: 112,
              child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                  ? Image.network(
                      item.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const _CartImageFallback(),
                    )
                  : const _CartImageFallback(),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        item.productName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: _elvaneInk,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          height: 1.18,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    SizedBox(
                      width: 38,
                      height: 38,
                      child: IconButton(
                        tooltip: 'Remove',
                        padding: EdgeInsets.zero,
                        onPressed: _busy ? null : _remove,
                        icon: const Icon(Icons.close_rounded, size: 20),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: <Widget>[
                    _MetaChip(label: item.variantName),
                    if (item.sku.isNotEmpty) _MetaChip(label: item.sku),
                  ],
                ),
                const SizedBox(height: 9),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: _StockLabel(
                        text: item.issue ??
                            (isLowStock
                                ? 'Only ${item.availableStock} left'
                                : '${item.availableStock} available'),
                        isError: hasIssue,
                        isLowStock: isLowStock,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'RM ${item.lineTotal.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: _elvaneInk,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'RM ${item.price.toStringAsFixed(2)} each',
                  style: const TextStyle(
                    color: _elvaneMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (item.quantity > item.availableStock &&
                    item.availableStock > 0 &&
                    item.productActive &&
                    item.variantActive) ...<Widget>[
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _elvaneInk,
                        side: const BorderSide(color: _elvaneInk),
                      ),
                      onPressed:
                          _busy ? null : () => _update(item.availableStock),
                      icon: const Icon(Icons.inventory_2_outlined, size: 17),
                      label: Text('Adjust to ${item.availableStock}'),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: <Widget>[
                    _QuantityControl(
                      quantity: item.quantity,
                      busy: _busy,
                      canDecrease: item.quantity > 1,
                      canIncrease: item.productActive &&
                          item.variantActive &&
                          item.quantity < item.availableStock &&
                          item.quantity < 99,
                      onDecrease: () => _update(item.quantity - 1),
                      onIncrease: () => _update(item.quantity + 1),
                    ),
                    if (_busy) ...<Widget>[
                      const SizedBox(width: 12),
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: _elvaneSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: _elvaneMuted,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _StockLabel extends StatelessWidget {
  const _StockLabel({
    required this.text,
    required this.isError,
    required this.isLowStock,
  });

  final String text;
  final bool isError;
  final bool isLowStock;

  @override
  Widget build(BuildContext context) {
    final color = isError
        ? Theme.of(context).colorScheme.error
        : isLowStock
            ? _elvaneInk
            : _elvaneMuted;

    return Row(
      children: <Widget>[
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            color: isError
                ? Theme.of(context).colorScheme.error
                : isLowStock
                    ? _elvaneAccent
                    : const Color(0xFFB8B8B1),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}

class _QuantityControl extends StatelessWidget {
  const _QuantityControl({
    required this.quantity,
    required this.busy,
    required this.canDecrease,
    required this.canIncrease,
    required this.onDecrease,
    required this.onIncrease,
  });

  final int quantity;
  final bool busy;
  final bool canDecrease;
  final bool canIncrease;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _elvaneSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          _QuantityButton(
            icon: Icons.remove_rounded,
            enabled: !busy && canDecrease,
            onTap: onDecrease,
          ),
          SizedBox(
            width: 36,
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: _elvaneInk,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          _QuantityButton(
            icon: Icons.add_rounded,
            enabled: !busy && canIncrease,
            onTap: onIncrease,
          ),
        ],
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      constraints: const BoxConstraints.tightFor(width: 38, height: 38),
      padding: EdgeInsets.zero,
      onPressed: enabled ? onTap : null,
      icon: Icon(icon, size: 18),
      color: _elvaneInk,
      disabledColor: const Color(0xFFB8B8B1),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 70, 24, 40),
      children: <Widget>[
        Center(
          child: Container(
            width: 82,
            height: 82,
            decoration: const BoxDecoration(
              color: _elvaneAccent,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.shopping_bag_outlined,
              color: _elvaneInk,
              size: 38,
            ),
          ),
        ),
        const SizedBox(height: 22),
        const Text(
          'Nothing in your bag yet',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: _elvaneInk,
            fontSize: 25,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.6,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Find something you like, choose a variant, and it will stay synced with your Elvane account.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: _elvaneMuted,
            height: 1.45,
          ),
        ),
        const SizedBox(height: 24),
        Center(
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: _elvaneInk,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
            ),
            onPressed: () => context.go('/'),
            icon: const Icon(Icons.arrow_back_rounded),
            label: const Text(
              'Browse products',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    );
  }
}

class _CartLoading extends StatelessWidget {
  const _CartLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 32),
      children: <Widget>[
        Container(
          height: 176,
          decoration: BoxDecoration(
            color: _elvaneInk,
            borderRadius: BorderRadius.circular(28),
          ),
          child: const Center(
            child: CircularProgressIndicator(color: _elvaneAccent),
          ),
        ),
      ],
    );
  }
}

class _CartError extends StatelessWidget {
  const _CartError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 72, 24, 40),
      children: <Widget>[
        const Center(
          child: Icon(Icons.cloud_off_outlined, size: 52),
        ),
        const SizedBox(height: 16),
        const Text(
          'Could not load cart',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: _elvaneInk,
            fontSize: 22,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: _elvaneMuted),
        ),
        const SizedBox(height: 20),
        Center(
          child: FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: _elvaneInk,
              foregroundColor: Colors.white,
            ),
            onPressed: onRetry,
            child: const Text('Try again'),
          ),
        ),
      ],
    );
  }
}

class _CartImageFallback extends StatelessWidget {
  const _CartImageFallback();

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(
      color: _elvaneSoft,
      child: Center(
        child: Icon(
          Icons.inventory_2_outlined,
          color: _elvaneMuted,
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
