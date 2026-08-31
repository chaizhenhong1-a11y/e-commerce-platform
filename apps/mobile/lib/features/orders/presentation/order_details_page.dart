import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

class _OrderDetailsPageState extends ConsumerState<OrderDetailsPage> {
  bool _cancelling = false;

  @override
  Widget build(BuildContext context) {
    final details = ref.watch(orderDetailsProvider(widget.orderNumber));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Order details'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh',
            onPressed: () =>
                ref.invalidate(orderDetailsProvider(widget.orderNumber)),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.refresh(orderDetailsProvider(widget.orderNumber).future),
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
                _CancellationCard(
                  cancelling: _cancelling,
                  onCancel: () => _cancelOrder(order),
                ),
              ],
              const SizedBox(height: 14),
              _Timeline(order: order),
              const SizedBox(height: 14),
              _OrderItems(order: order),
              const SizedBox(height: 14),
              _ShippingCard(order: order),
            ],
          ),
        ),
      ),
    );
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

    if (confirmed != true || _cancelling) return;

    setState(() => _cancelling = true);

    try {
      await ref.read(ordersRepositoryProvider).cancelOrder(order.orderNumber);
      ref.invalidate(customerOrdersProvider);
      ref.invalidate(orderDetailsProvider(order.orderNumber));

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

class _CancellationCard extends StatelessWidget {
  const _CancellationCard({
    required this.cancelling,
    required this.onCancel,
  });

  final bool cancelling;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Need to cancel?',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Unpaid orders can be cancelled before payment.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            FilledButton.tonal(
              onPressed: cancelling ? null : onCancel,
              child: Text(cancelling ? 'Cancelling…' : 'Cancel'),
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
        description: 'Your order was received by TextShop.',
        active: true,
      ),
      _TimelineStep(
        label: 'Order cancelled',
        description: 'This order will not continue to fulfilment.',
        active: true,
        stopped: true,
      ),
    ];
  }

  if (order.status == 'EXPIRED') {
    return const <_TimelineStep>[
      _TimelineStep(
        label: 'Order created',
        description: 'Inventory was reserved while payment was pending.',
        active: true,
      ),
      _TimelineStep(
        label: 'Reservation expired',
        description:
            'Payment was not completed in time and inventory was released.',
        active: true,
        stopped: true,
      ),
    ];
  }

  return <_TimelineStep>[
    const _TimelineStep(
      label: 'Order created',
      description: 'Your order was received by TextShop.',
      active: true,
    ),
    _TimelineStep(
      label: 'Payment confirmed',
      description: 'Payment has been accepted and the order is confirmed.',
      active: order.status != 'AWAITING_PAYMENT',
    ),
    _TimelineStep(
      label: 'Fulfilled',
      description: 'The order has completed fulfilment.',
      active: order.status == 'FULFILLED',
    ),
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
