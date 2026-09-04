import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/staff_repository.dart';
import '../domain/staff_order.dart';
import 'staff_providers.dart';
import 'staff_ui_theme.dart';

class StaffOrdersPage extends ConsumerStatefulWidget {
  const StaffOrdersPage({super.key});

  @override
  ConsumerState<StaffOrdersPage> createState() => _StaffOrdersPageState();
}

class _StaffOrdersPageState extends ConsumerState<StaffOrdersPage> {
  static const _statuses = <String>[
    'ALL',
    'AWAITING_PAYMENT',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'FULFILLED',
    'CANCELLED',
    'EXPIRED',
  ];
  static const _payments = <String>[
    'ALL',
    'PENDING',
    'PAID',
    'PARTIALLY_REFUNDED',
    'REFUNDED',
    'FAILED',
  ];

  final _searchController = TextEditingController();
  List<StaffOrder> _orders = const <StaffOrder>[];
  String _status = 'ALL';
  String _payment = 'ALL';
  String _appliedQuery = '';
  String? _busyOrderNumber;
  String? _error;
  bool _loading = true;

  StaffRepository get _repository => ref.read(staffRepositoryProvider);

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_load);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final orders = await _repository.getOrders(
        status: _status,
        paymentStatus: _payment,
        query: _appliedQuery,
      );
      if (!mounted) return;
      setState(() => _orders = orders);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to load orders.'));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _runTransition(
    StaffOrder order, {
    required String confirmation,
    required Future<void> Function() action,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm action'),
        content: Text(confirmation),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _busyOrderNumber = order.orderNumber;
      _error = null;
    });
    try {
      await action();
      await _load();
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to update order.'));
    } finally {
      if (mounted) {
        setState(() => _busyOrderNumber = null);
      }
    }
  }

  Future<void> _openShipping(StaffOrder order) async {
    final draft = await showDialog<_ShippingDraft>(
      context: context,
      builder: (context) => _ShippingDialog(orderNumber: order.orderNumber),
    );
    if (draft == null || !mounted) return;

    setState(() {
      _busyOrderNumber = order.orderNumber;
      _error = null;
    });
    try {
      await _repository.shipOrder(
        orderNumber: order.orderNumber,
        courierName: draft.courierName,
        trackingNumber: draft.trackingNumber,
        trackingUrl: draft.trackingUrl,
      );
      await _load();
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to ship order.'));
    } finally {
      if (mounted) {
        setState(() => _busyOrderNumber = null);
      }
    }
  }

  String _message(Object error, String fallback) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message.trim();
        }
        if (message is List && message.isNotEmpty) {
          return message.first.toString();
        }
      }
    }
    return fallback;
  }

  String _money(StaffOrder order) {
    return '${order.currency} ${(order.totalCents / 100).toStringAsFixed(2)}';
  }

  String _date(DateTime? value) {
    if (value == null) return '—';
    final local = value.toLocal();
    String two(int value) => value.toString().padLeft(2, '0');
    return '${two(local.day)}/${two(local.month)}/${local.year} '
        '${two(local.hour)}:${two(local.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    return StaffUiTheme(
        child: Scaffold(
      appBar: AppBar(
        title: const Text('Orders & fulfillment'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Order, customer, product or SKU',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: IconButton(
                  tooltip: 'Search',
                  onPressed: () {
                    setState(
                      () => _appliedQuery = _searchController.text.trim(),
                    );
                    _load();
                  },
                  icon: const Icon(Icons.arrow_forward_rounded),
                ),
              ),
              onSubmitted: (value) {
                setState(() => _appliedQuery = value.trim());
                _load();
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _status,
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: _statuses
                        .map(
                          (value) => DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          ),
                        )
                        .toList(growable: false),
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() => _status = value);
                      _load();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _payment,
                    decoration: const InputDecoration(labelText: 'Payment'),
                    items: _payments
                        .map(
                          (value) => DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          ),
                        )
                        .toList(growable: false),
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() => _payment = value);
                      _load();
                    },
                  ),
                ),
              ],
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: 14),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Text(_error!),
                ),
              ),
            ],
            const SizedBox(height: 14),
            if (_loading && _orders.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_orders.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: Text('No orders match these filters.')),
              )
            else
              ..._orders.map(_orderCard),
          ],
        ),
      ),
    ));
  }

  Widget _orderCard(StaffOrder order) {
    final busy = _busyOrderNumber == order.orderNumber;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        order.orderNumber,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text('${order.customerName} · ${order.email}'),
                      const SizedBox(height: 4),
                      Text(_date(order.createdAt)),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  _money(order),
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                Chip(label: Text(order.status)),
                Chip(label: Text(order.paymentStatus)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${order.itemCount} item${order.itemCount == 1 ? '' : 's'}',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            ...order.items.take(3).map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '${item.productName} · ${item.variantName} · '
                      '${item.sku} × ${item.quantity}',
                    ),
                  ),
                ),
            if (order.processingAt != null) ...<Widget>[
              const SizedBox(height: 8),
              Text('Processing: ${_date(order.processingAt)}'),
            ],
            if (order.trackingNumber != null) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                'Delivery: ${order.courierName ?? 'Courier'} · '
                '${order.trackingNumber}',
              ),
            ],
            if (order.shippedAt != null)
              Text('Shipped: ${_date(order.shippedAt)}'),
            if (order.deliveredAt != null)
              Text('Delivered: ${_date(order.deliveredAt)}'),
            if (order.canProcess ||
                order.canShip ||
                order.canDeliver) ...<Widget>[
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: <Widget>[
                  if (order.canProcess)
                    FilledButton(
                      onPressed: busy
                          ? null
                          : () => _runTransition(
                                order,
                                confirmation:
                                    'Move ${order.orderNumber} into processing?',
                                action: () => _repository.startProcessing(
                                  order.orderNumber,
                                ),
                              ),
                      child: const Text('Start processing'),
                    ),
                  if (order.canShip)
                    FilledButton(
                      onPressed: busy ? null : () => _openShipping(order),
                      child: const Text('Ship order'),
                    ),
                  if (order.canDeliver)
                    FilledButton(
                      onPressed: busy
                          ? null
                          : () => _runTransition(
                                order,
                                confirmation:
                                    'Mark ${order.orderNumber} as delivered?',
                                action: () => _repository.markDelivered(
                                  order.orderNumber,
                                ),
                              ),
                      child: const Text('Mark delivered'),
                    ),
                  if (busy)
                    const Padding(
                      padding: EdgeInsets.all(10),
                      child: SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ShippingDraft {
  const _ShippingDraft({
    required this.courierName,
    required this.trackingNumber,
    this.trackingUrl,
  });

  final String courierName;
  final String trackingNumber;
  final String? trackingUrl;
}

class _ShippingDialog extends StatefulWidget {
  const _ShippingDialog({required this.orderNumber});

  final String orderNumber;

  @override
  State<_ShippingDialog> createState() => _ShippingDialogState();
}

class _ShippingDialogState extends State<_ShippingDialog> {
  final _formKey = GlobalKey<FormState>();
  final _courierController = TextEditingController();
  final _trackingController = TextEditingController();
  final _urlController = TextEditingController();

  @override
  void dispose() {
    _courierController.dispose();
    _trackingController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add tracking details'),
      content: SizedBox(
        width: 420,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(widget.orderNumber),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _courierController,
                  decoration: const InputDecoration(
                    labelText: 'Courier',
                    hintText: 'J&T Express',
                  ),
                  validator: _required,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _trackingController,
                  decoration: const InputDecoration(
                    labelText: 'Tracking number',
                    hintText: 'MY123456789',
                  ),
                  validator: _required,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _urlController,
                  keyboardType: TextInputType.url,
                  decoration: const InputDecoration(
                    labelText: 'Tracking URL (optional)',
                    hintText: 'https://...',
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.isEmpty) return null;
                    final uri = Uri.tryParse(text);
                    if (uri == null ||
                        !uri.hasAuthority ||
                        (uri.scheme != 'http' && uri.scheme != 'https')) {
                      return 'Enter a valid http:// or https:// URL.';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            if (!(_formKey.currentState?.validate() ?? false)) return;
            Navigator.pop(
              context,
              _ShippingDraft(
                courierName: _courierController.text.trim(),
                trackingNumber: _trackingController.text.trim(),
                trackingUrl: _urlController.text.trim().isEmpty
                    ? null
                    : _urlController.text.trim(),
              ),
            );
          },
          child: const Text('Mark shipped'),
        ),
      ],
    );
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required.';
    }
    return null;
  }
}
