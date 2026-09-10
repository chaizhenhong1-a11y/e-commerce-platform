import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../auth/presentation/auth_providers.dart';
import '../../checkout/presentation/checkout_providers.dart';
import 'package:go_router/go_router.dart';
import '../domain/order_details.dart';
import 'order_providers.dart';

class OrderDetailsPage extends ConsumerStatefulWidget {
  const OrderDetailsPage({
    required this.orderNumber,
    super.key,
  });

  final String orderNumber;

  @override
  ConsumerState<OrderDetailsPage> createState() => _OrderDetailsPageState();
}

class _OrderDetailsPageState extends ConsumerState<OrderDetailsPage>
    with WidgetsBindingObserver {
  bool _cancelling = false;
  bool _paying = false;
  bool _refunding = false;
  bool _reconcilingPayment = false;
  bool _returning = false;
  bool _liveRefreshInFlight = false;
  bool _paymentReturnReconciled = false;
  Timer? _liveRefreshTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _startLiveRefresh();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_reconcilePendingPayment());
    });
  }

  @override
  void dispose() {
    _liveRefreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startLiveRefresh();
      unawaited(_refreshOrderState(widget.orderNumber));
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.detached) {
      _liveRefreshTimer?.cancel();
      _liveRefreshTimer = null;
    }
  }

  void _startLiveRefresh() {
    if (_liveRefreshTimer?.isActive ?? false) {
      return;
    }

    _liveRefreshTimer = Timer.periodic(
      const Duration(seconds: 4),
      (_) => unawaited(_refreshFulfillmentIfNeeded()),
    );
  }

  Future<void> _refreshFulfillmentIfNeeded() async {
    if (!mounted || _liveRefreshInFlight) {
      return;
    }

    final current = ref.read(orderDetailsProvider(widget.orderNumber));
    final status = current.valueOrNull?.status;
    if (status == 'DELIVERED' ||
        status == 'FULFILLED' ||
        status == 'CANCELLED' ||
        status == 'REFUNDED') {
      _liveRefreshTimer?.cancel();
      _liveRefreshTimer = null;
      return;
    }

    _liveRefreshInFlight = true;
    try {
      final refreshed = await ref.refresh(
        orderDetailsProvider(widget.orderNumber).future,
      );
      await ref.refresh(customerOrdersProvider.future).then<void>((_) {});

      if (refreshed.status == 'DELIVERED' ||
          refreshed.status == 'FULFILLED' ||
          refreshed.status == 'CANCELLED' ||
          refreshed.status == 'REFUNDED') {
        _liveRefreshTimer?.cancel();
        _liveRefreshTimer = null;
      }
    } catch (_) {
      // Keep the last successful order state visible. The next interval retries.
    } finally {
      _liveRefreshInFlight = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order details')),
        body: Center(
          child: FilledButton(
            onPressed: () => context
                .go('/sign-in?returnTo=${Uri.encodeComponent('/orders')}'),
            child: const Text('Sign in to view orders'),
          ),
        ),
      );
    }
    final details = ref.watch(orderDetailsProvider(widget.orderNumber));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Order details'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => _refreshOrderState(widget.orderNumber),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _refreshOrderState(widget.orderNumber),
        child: details.when(
          loading: () => const _ScrollableState(
            child: CircularProgressIndicator(),
          ),
          error: (error, stackTrace) => _ScrollableState(
            child: FilledButton.tonal(
              onPressed: () =>
                  ref.invalidate(orderDetailsProvider(widget.orderNumber)),
              child: const Text('Try again'),
            ),
          ),
          data: (order) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 36),
            children: <Widget>[
              _StatusHeader(order: order),
              if (order.status == 'AWAITING_PAYMENT') ...<Widget>[
                const SizedBox(height: 14),
                _PaymentRecoveryCard(
                  order: order,
                  paying: _paying,
                  reconciling: _reconcilingPayment,
                  cancelling: _cancelling,
                  onPay: () => _continuePayment(order),
                  onCancel: () => _cancelOrder(order),
                ),
              ],
              if (order.refund != null ||
                  (order.paymentStatus == 'PAID' &&
                      order.status == 'CONFIRMED')) ...<Widget>[
                const SizedBox(height: 14),
                _RefundCard(
                  order: order,
                  busy: _refunding,
                  onRefund: () => _requestRefund(order),
                ),
              ],
              if (order.returnRequest != null ||
                  (order.paymentStatus == 'PAID' &&
                      (order.status == 'DELIVERED' ||
                          order.status == 'FULFILLED') &&
                      order.refund == null)) ...<Widget>[
                const SizedBox(height: 14),
                _ReturnCard(
                  order: order,
                  busy: _returning,
                  onReturn: () => _requestReturn(order),
                ),
              ],
              const SizedBox(height: 14),
              _Timeline(order: order),
              const SizedBox(height: 14),
              _OrderItems(order: order),
              const SizedBox(height: 14),
              if (order.status == 'PROCESSING' ||
                  order.status == 'SHIPPED' ||
                  order.status == 'DELIVERED' ||
                  order.status == 'FULFILLED' ||
                  order.fulfillment.trackingNumber != null) ...<Widget>[
                _DeliveryCard(order: order),
                const SizedBox(height: 14),
              ],
              _ShippingCard(order: order),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _refreshOrderState(String orderNumber) async {
    await Future.wait<void>(<Future<void>>[
      ref.refresh(orderDetailsProvider(orderNumber).future).then((_) {}),
      ref.refresh(customerOrdersProvider.future).then((_) {}),
    ]);

    if (mounted) {
      _startLiveRefresh();
    }
  }

  Future<void> _reconcilePendingPayment() async {
    if (!mounted || _paymentReturnReconciled) {
      return;
    }
    _paymentReturnReconciled = true;
    setState(() => _reconcilingPayment = true);

    const maxAttempts = 10;
    const retryDelay = Duration(seconds: 2);

    for (var attempt = 0; attempt < maxAttempts && mounted; attempt++) {
      try {
        final order = await ref.refresh(
          orderDetailsProvider(widget.orderNumber).future,
        );

        if (order.status != 'AWAITING_PAYMENT' ||
            order.paymentStatus != 'PENDING') {
          ref.invalidate(customerOrdersProvider);
          return;
        }

        final existingProvider = order.payment?.provider;
        if (existingProvider == null || existingProvider == 'MANUAL_TEST') {
          if (mounted) setState(() => _reconcilingPayment = false);
          return;
        }

        final payment =
            await ref.read(checkoutRepositoryProvider).reconcilePayment(
                  orderNumber: order.orderNumber,
                );

        if (payment.currency != order.currency ||
            payment.amountCents != order.totalCents) {
          throw StateError(
            'Payment amount does not match the current order total.',
          );
        }

        if (payment.status == 'PAID') {
          await _refreshOrderState(order.orderNumber);
          if (mounted) {
            setState(() => _reconcilingPayment = false);
          }
          return;
        }
      } catch (_) {
        // Stripe may still be finalising the Checkout Session or the webhook
        // may still be in flight. Retry for a short bounded window instead of
        // making the customer press Continue payment to trigger reconciliation.
      }

      if (attempt < maxAttempts - 1 && mounted) {
        await Future<void>.delayed(retryDelay);
      }
    }

    if (mounted) {
      await _refreshOrderState(widget.orderNumber);
      setState(() => _reconcilingPayment = false);
    }
  }

  Future<void> _continuePayment(OrderDetails order) async {
    if (_paying || _cancelling) {
      return;
    }

    setState(() => _paying = true);

    try {
      final repository = ref.read(checkoutRepositoryProvider);
      final existingProvider = order.payment?.provider;
      final provider =
          existingProvider == 'MANUAL_TEST' ? 'MANUAL_TEST' : 'STRIPE';
      final payment = await repository.createPayment(
        orderNumber: order.orderNumber,
        provider: provider,
      );

      if (payment.currency != order.currency ||
          payment.amountCents != order.totalCents) {
        throw StateError(
          'Payment amount does not match the current order total.',
        );
      }

      if (payment.status == 'PAID') {
        await _refreshOrderState(order.orderNumber);
        return;
      }

      if (payment.provider == 'MANUAL_TEST') {
        await repository.confirmDevelopmentPayment(payment.id);
        await _refreshOrderState(order.orderNumber);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Development payment completed.')),
          );
        }
        return;
      }

      final url = payment.checkoutUrl;
      if (url == null || url.isEmpty) {
        throw StateError('Payment provider did not return a checkout URL.');
      }

      final opened = await launchUrl(
        Uri.parse(url),
        mode: kIsWeb
            ? LaunchMode.platformDefault
            : LaunchMode.externalApplication,
        // Keep the running Flutter Web order page alive while Stripe is open.
        // Replacing this tab would force Flutter, routing, auth, and providers
        // to bootstrap again when Stripe redirects back.
        webOnlyWindowName: kIsWeb ? '_blank' : null,
      );
      if (!opened) {
        throw StateError('Unable to open the payment provider.');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              kIsWeb
                  ? 'Secure payment opened in a new tab. Keep this Elvane '
                      'tab open; the order will refresh automatically.'
                  : 'Secure payment opened. Return to Elvane after paying; '
                      'this order will refresh automatically.',
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _paying = false);
      }
    }
  }

  Future<void> _requestReturn(OrderDetails order) async {
    final selected = <String>{for (final item in order.items) item.id};

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Start a return'),
          content: SizedBox(
            width: 420,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Select the fulfilled items you want to return. A return request does not immediately refund money or restock inventory.',
                  ),
                  const SizedBox(height: 12),
                  for (final item in order.items)
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: selected.contains(item.id),
                      title: Text(item.productName),
                      subtitle: Text(
                        '${item.variantName} · ${item.sku} · Qty ${item.quantity}',
                      ),
                      onChanged: (value) {
                        setDialogState(() {
                          if (value == true) {
                            selected.add(item.id);
                          } else {
                            selected.remove(item.id);
                          }
                        });
                      },
                    ),
                ],
              ),
            ),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Not now'),
            ),
            FilledButton(
              onPressed: selected.isEmpty
                  ? null
                  : () => Navigator.of(dialogContext).pop(true),
              child: const Text('Submit return'),
            ),
          ],
        ),
      ),
    );

    if (!mounted || confirmed != true || _returning || selected.isEmpty) {
      return;
    }
    setState(() => _returning = true);

    try {
      final items = order.items
          .where((item) => selected.contains(item.id))
          .map(
            (item) => <String, dynamic>{
              'orderItemId': item.id,
              'quantity': item.quantity,
            },
          )
          .toList(growable: false);
      await ref
          .read(ordersRepositoryProvider)
          .requestReturn(order.orderNumber, items);
      await _refreshOrderState(order.orderNumber);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Return request submitted.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _returning = false);
    }
  }

  Future<void> _requestRefund(OrderDetails order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Request a full refund?'),
        content: const Text(
          'The full paid amount will be returned through the original payment provider. Inventory is handled separately.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Request refund'),
          ),
        ],
      ),
    );
    if (!mounted || confirmed != true || _refunding) {
      return;
    }
    setState(() => _refunding = true);
    try {
      await ref.read(ordersRepositoryProvider).requestRefund(order.orderNumber);
      await _refreshOrderState(order.orderNumber);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Refund request submitted.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) setState(() => _refunding = false);
    }
  }

  Future<void> _cancelOrder(OrderDetails order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancel order?'),
        content: const Text(
          'This unpaid order will be cancelled and its reserved inventory '
          'will be released immediately.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Keep order'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Cancel order'),
          ),
        ],
      ),
    );

    if (!mounted || confirmed != true || _cancelling || _paying) {
      return;
    }

    setState(() => _cancelling = true);

    try {
      await ref.read(ordersRepositoryProvider).cancelOrder(order.orderNumber);
      await _refreshOrderState(order.orderNumber);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order cancelled.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _cancelling = false);
      }
    }
  }
}

class _ReturnCard extends StatelessWidget {
  const _ReturnCard({
    required this.order,
    required this.busy,
    required this.onReturn,
  });

  final OrderDetails order;
  final bool busy;
  final VoidCallback onReturn;

  @override
  Widget build(BuildContext context) {
    final request = order.returnRequest;
    final canStart = (order.paymentStatus == 'PAID' ||
            order.paymentStatus == 'PARTIALLY_REFUNDED') &&
        (order.status == 'DELIVERED' || order.status == 'FULFILLED') &&
        (request == null ||
            request.status == 'REJECTED' ||
            request.status == 'CANCELLED' ||
            request.status == 'COMPLETED');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Text(
              'Return',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 6),
            Text(
              request == null
                  ? 'This delivered order can enter the return workflow.'
                  : 'Status: ${request.status} · ${request.items.length} selected item line(s)',
            ),
            if (request != null) ...<Widget>[
              const SizedBox(height: 10),
              for (final item in request.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    '${item.productName} · ${item.variantName} · Qty ${item.quantity}',
                  ),
                ),
            ],
            const SizedBox(height: 12),
            if (canStart)
              FilledButton.tonal(
                onPressed: busy ? null : onReturn,
                child: Text(busy ? 'Submitting…' : 'Start return'),
              ),
            const SizedBox(height: 6),
            Text(
              'Refund and restocking remain separate until returned goods are reviewed.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RefundCard extends StatelessWidget {
  const _RefundCard(
      {required this.order, required this.busy, required this.onRefund});
  final OrderDetails order;
  final bool busy;
  final VoidCallback onRefund;

  @override
  Widget build(BuildContext context) {
    final refund = order.refund;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Text('Refund', style: TextStyle(fontWeight: FontWeight.w900)),
            const SizedBox(height: 6),
            Text(
              refund == null
                  ? 'You can request a full refund to the original payment method while this order is still confirmed.'
                  : 'Status: ${refund.status} · RM ${(refund.amountCents / 100).toStringAsFixed(2)}',
            ),
            const SizedBox(height: 12),
            if (refund == null)
              FilledButton.tonal(
                onPressed: busy ? null : onRefund,
                child: Text(busy ? 'Submitting…' : 'Request refund'),
              ),
            const SizedBox(height: 6),
            Text(
              'Refunds and inventory are separate workflows. Delivered items must use the return process.',
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentRecoveryCard extends StatelessWidget {
  const _PaymentRecoveryCard({
    required this.order,
    required this.paying,
    required this.reconciling,
    required this.cancelling,
    required this.onPay,
    required this.onCancel,
  });

  final OrderDetails order;
  final bool paying;
  final bool reconciling;
  final bool cancelling;
  final VoidCallback onPay;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final expiresAt = order.reservationExpiresAt;
    final expired = expiresAt != null && expiresAt.isBefore(DateTime.now());

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Text(
              'Payment',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 4),
            Text(
              expired
                  ? 'The inventory reservation has expired.'
                  : order.payment == null
                      ? 'Complete payment before the 30-minute inventory reservation ends.'
                      : reconciling
                          ? 'We are confirming the latest payment with ${order.payment!.provider}.'
                          : 'Payment has not been confirmed yet. You can pay now using ${order.payment!.provider}.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: <Widget>[
                Expanded(
                  child: FilledButton(
                    onPressed: expired || paying || reconciling || cancelling
                        ? null
                        : onPay,
                    child: Text(reconciling
                        ? 'Confirming payment…'
                        : paying
                            ? 'Opening payment…'
                            : 'Pay now'),
                  ),
                ),
                const SizedBox(width: 10),
                TextButton(
                  onPressed:
                      paying || reconciling || cancelling ? null : onCancel,
                  child: Text(cancelling ? 'Cancelling…' : 'Cancel order'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusHeader extends StatelessWidget {
  const _StatusHeader({required this.order});

  final OrderDetails order;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              _statusLabel(order.status),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              order.orderNumber,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: <Widget>[
                Expanded(
                  child: _Metric(
                    label: 'Payment',
                    value: order.paymentStatus,
                  ),
                ),
                Expanded(
                  child: _Metric(
                    label: 'Placed',
                    value: _formatDate(order.createdAt),
                  ),
                ),
                Expanded(
                  child: _Metric(
                    label: 'Total',
                    value: 'RM ${order.total.toStringAsFixed(2)}',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.order});

  final OrderDetails order;

  @override
  Widget build(BuildContext context) {
    final steps = _timelineSteps(order);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Order status',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 18),
            ...steps.asMap().entries.map(
              (entry) {
                final index = entry.key;
                final step = entry.value;
                final last = index == steps.length - 1;

                return IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      SizedBox(
                        width: 24,
                        child: Column(
                          children: <Widget>[
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: step.active
                                    ? step.stopped
                                        ? Theme.of(context).colorScheme.error
                                        : Theme.of(context).colorScheme.primary
                                    : Theme.of(context)
                                        .colorScheme
                                        .surfaceContainerHighest,
                              ),
                            ),
                            if (!last)
                              Expanded(
                                child: Container(
                                  width: 2,
                                  margin:
                                      const EdgeInsets.symmetric(vertical: 4),
                                  color: Theme.of(context)
                                      .colorScheme
                                      .outlineVariant,
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(bottom: last ? 0 : 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                step.label,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                step.description,
                                style: TextStyle(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderItems extends StatelessWidget {
  const _OrderItems({required this.order});

  final OrderDetails order;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Order summary',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 16),
            ...order.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
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
                          const SizedBox(height: 4),
                          Text(
                            '${item.variantName} · ${item.sku} · '
                            'Qty ${item.quantity}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'RM ${(item.lineTotalCents / 100).toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 24),
            _totalRow(
              'Subtotal',
              'RM ${order.subtotal.toStringAsFixed(2)}',
            ),
            const SizedBox(height: 8),
            _totalRow(
              'Shipping',
              order.shippingCents == 0
                  ? 'Free'
                  : 'RM ${order.shippingTotal.toStringAsFixed(2)}',
            ),
            if (order.discountCents > 0) ...<Widget>[
              const SizedBox(height: 8),
              _totalRow(
                order.couponCode == null
                    ? 'Discount'
                    : 'Discount (${order.couponCode})',
                '- RM ${(order.discountCents / 100).toStringAsFixed(2)}',
              ),
            ],
            const Divider(height: 24),
            _totalRow(
              'Total',
              'RM ${order.total.toStringAsFixed(2)}',
              strong: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _totalRow(String label, String value, {bool strong = false}) {
    final style = TextStyle(
      fontWeight: strong ? FontWeight.w900 : FontWeight.w600,
      fontSize: strong ? 17 : null,
    );

    return Row(
      children: <Widget>[
        Expanded(child: Text(label, style: style)),
        Text(value, style: style),
      ],
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  const _DeliveryCard({required this.order});

  final OrderDetails order;

  @override
  Widget build(BuildContext context) {
    final delivery = order.fulfillment;
    final delivered =
        order.status == 'DELIVERED' || order.status == 'FULFILLED';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              delivered
                  ? 'Delivered'
                  : order.status == 'SHIPPED'
                      ? 'On the way'
                      : 'Preparing shipment',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            if (delivery.processingAt != null) ...<Widget>[
              const SizedBox(height: 14),
              Text('Processing: ${_formatDateTime(delivery.processingAt!)}'),
            ],
            if (delivery.courierName != null) ...<Widget>[
              const SizedBox(height: 14),
              Text('Courier: ${delivery.courierName}'),
            ],
            if (delivery.trackingNumber != null) ...<Widget>[
              const SizedBox(height: 6),
              SelectableText(
                'Tracking: ${delivery.trackingNumber}',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ],
            if (delivery.shippedAt != null) ...<Widget>[
              const SizedBox(height: 6),
              Text('Shipped: ${_formatDateTime(delivery.shippedAt!)}'),
            ],
            if (delivery.deliveredAt != null) ...<Widget>[
              const SizedBox(height: 6),
              Text('Delivered: ${_formatDateTime(delivery.deliveredAt!)}'),
            ],
            if (_trackingUri(delivery.trackingUrl) case final uri?) ...<Widget>[
              const SizedBox(height: 14),
              FilledButton.tonalIcon(
                onPressed: () async {
                  try {
                    final opened = await launchUrl(
                      uri,
                      mode: LaunchMode.externalApplication,
                    );
                    if (!opened && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Unable to open tracking link.'),
                        ),
                      );
                    }
                  } catch (_) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Unable to open tracking link.'),
                        ),
                      );
                    }
                  }
                },
                icon: const Icon(Icons.local_shipping_outlined),
                label: const Text('Track parcel'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ShippingCard extends StatelessWidget {
  const _ShippingCard({required this.order});

  final OrderDetails order;

  @override
  Widget build(BuildContext context) {
    final shipping = order.shipping;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Shipping details',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 14),
            Text(
              shipping.fullName,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(shipping.phone),
            Text(shipping.line1),
            if (shipping.line2 != null && shipping.line2!.isNotEmpty)
              Text(shipping.line2!),
            Text(
              '${shipping.postcode} ${shipping.city}, ${shipping.state}',
            ),
            Text(shipping.countryCode),
            const Divider(height: 28),
            Text('Standard delivery · ${order.email}'),
          ],
        ),
      ),
    );
  }
}

class _ScrollableState extends StatelessWidget {
  const _ScrollableState({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: <Widget>[
        SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.65,
          child: Center(child: child),
        ),
      ],
    );
  }
}

class _TimelineStep {
  const _TimelineStep({
    required this.label,
    required this.description,
    required this.active,
    this.stopped = false,
  });

  final String label;
  final String description;
  final bool active;
  final bool stopped;
}

List<_TimelineStep> _timelineSteps(OrderDetails order) {
  if (order.status == 'CANCELLED') {
    return const <_TimelineStep>[
      _TimelineStep(
          label: 'Order created',
          description: 'Your order was received by Elvane.',
          active: true),
      _TimelineStep(
          label: 'Order cancelled',
          description: 'This order will not continue to fulfilment.',
          active: true,
          stopped: true),
    ];
  }

  if (order.status == 'EXPIRED') {
    return const <_TimelineStep>[
      _TimelineStep(
          label: 'Order created',
          description: 'Inventory was reserved while payment was pending.',
          active: true),
      _TimelineStep(
          label: 'Reservation expired',
          description:
              'Payment was not completed in time and inventory was released.',
          active: true,
          stopped: true),
    ];
  }

  const ranks = <String, int>{
    'AWAITING_PAYMENT': 0,
    'CONFIRMED': 1,
    'PROCESSING': 2,
    'SHIPPED': 3,
    'DELIVERED': 4,
    'FULFILLED': 4,
  };
  final rank = ranks[order.status] ?? 0;

  return <_TimelineStep>[
    const _TimelineStep(
        label: 'Order created',
        description: 'Your order was received by Elvane.',
        active: true),
    _TimelineStep(
        label: 'Payment confirmed',
        description: 'Payment has been accepted and the order is confirmed.',
        active: rank >= 1),
    _TimelineStep(
        label: 'Processing',
        description: 'Your order is being prepared for dispatch.',
        active: rank >= 2),
    _TimelineStep(
        label: 'Shipped',
        description: 'The parcel has left the warehouse.',
        active: rank >= 3),
    _TimelineStep(
        label: 'Delivered',
        description: 'The parcel has been marked as delivered.',
        active: rank >= 4),
  ];
}

String _statusLabel(String status) {
  return status
      .split('_')
      .map(
        (part) => part.isEmpty
            ? part
            : '${part[0]}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}

String _formatDate(DateTime value) {
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  return '$day/$month/${value.year}';
}

String _formatDateTime(DateTime value) {
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '${_formatDate(value)} $hour:$minute';
}

Uri? _trackingUri(String? rawUrl) {
  final value = rawUrl?.trim();
  if (value == null || value.isEmpty) {
    return null;
  }

  final uri = Uri.tryParse(value);
  if (uri == null ||
      (uri.scheme != 'https' && uri.scheme != 'http') ||
      uri.host.isEmpty) {
    return null;
  }

  return uri;
}
