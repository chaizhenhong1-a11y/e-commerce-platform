import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/staff_repository.dart';
import '../domain/staff_catalog.dart';
import 'staff_providers.dart';
import 'staff_ui_theme.dart';

class StaffCatalogPage extends ConsumerStatefulWidget {
  const StaffCatalogPage({super.key});

  @override
  ConsumerState<StaffCatalogPage> createState() => _StaffCatalogPageState();
}

class _StaffCatalogPageState extends ConsumerState<StaffCatalogPage> {
  static const _statuses = <String>['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'];

  final _searchController = TextEditingController();
  List<StaffCatalogProduct> _products = const <StaffCatalogProduct>[];
  String _status = 'ALL';
  String _query = '';
  bool _lowStockOnly = false;
  bool _loading = true;
  String? _busyVariantId;
  String? _error;

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
      final products = await _repository.getCatalog(
        query: _query,
        status: _status,
        lowStock: _lowStockOnly,
      );
      if (!mounted) return;
      setState(() => _products = products);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to load catalog.'));
    } finally {
      if (mounted) setState(() => _loading = false);
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

  String _money(StaffCatalogVariant variant) {
    return '${variant.currency} ${(variant.priceCents / 100).toStringAsFixed(2)}';
  }

  Future<void> _adjust(
    StaffCatalogProduct product,
    StaffCatalogVariant variant,
  ) async {
    final draft = await showDialog<_AdjustmentDraft>(
      context: context,
      builder: (context) => _InventoryAdjustmentDialog(
        productName: product.name,
        variant: variant,
      ),
    );
    if (draft == null || !mounted) return;

    setState(() {
      _busyVariantId = variant.id;
      _error = null;
    });
    try {
      final result = await _repository.adjustInventory(
        variantId: variant.id,
        delta: draft.delta,
        reason: draft.reason,
      );
      if (mounted) {
        _applyInventoryResult(variant.id, result);
      }
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${variant.sku} adjusted '
              '${draft.delta > 0 ? '+' : ''}${draft.delta}.',
            ),
          ),
        );
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Inventory adjustment failed.'));
    } finally {
      if (mounted) setState(() => _busyVariantId = null);
    }
  }

  void _applyInventoryResult(
    String variantId,
    StaffInventoryAdjustmentResult result,
  ) {
    setState(() {
      _products = _products.map((product) {
        var changed = false;
        final variants = product.variants.map((variant) {
          if (variant.id != variantId) {
            return variant;
          }
          changed = true;
          return StaffCatalogVariant(
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            priceCents: variant.priceCents,
            currency: variant.currency,
            isActive: variant.isActive,
            inventory: result.inventory,
          );
        }).toList(growable: false);

        if (!changed) {
          return product;
        }

        return StaffCatalogProduct(
          id: product.id,
          name: product.name,
          slug: product.slug,
          status: product.status,
          isFeatured: product.isFeatured,
          description: product.description,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          variants: variants,
          updatedAt: product.updatedAt,
        );
      }).toList(growable: false);
    });
  }

  Future<void> _history(
    StaffCatalogProduct product,
    StaffCatalogVariant variant,
  ) async {
    showDialog<void>(
      context: context,
      builder: (context) => _InventoryHistoryDialog(
        repository: _repository,
        productName: product.name,
        variant: variant,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return StaffUiTheme(
        child: Scaffold(
      appBar: AppBar(
        title: const Text('Catalog & inventory'),
        actions: <Widget>[
          IconButton(
            tooltip: 'New product',
            onPressed: () async {
              await context.push('/staff/catalog/new');
              if (mounted) {
                await _load();
              }
            },
            icon: const Icon(Icons.add_rounded),
          ),
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
                hintText: 'Product, slug or SKU',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: IconButton(
                  tooltip: 'Search',
                  onPressed: () {
                    setState(() => _query = _searchController.text.trim());
                    _load();
                  },
                  icon: const Icon(Icons.arrow_forward_rounded),
                ),
              ),
              onSubmitted: (value) {
                setState(() => _query = value.trim());
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
                  child: SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Low stock'),
                    value: _lowStockOnly,
                    onChanged: (value) {
                      setState(() => _lowStockOnly = value);
                      _load();
                    },
                  ),
                ),
              ],
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Text(_error!),
                ),
              ),
            ],
            const SizedBox(height: 12),
            if (_loading && _products.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_products.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: Text('No products match these filters.')),
              )
            else
              ..._products.map(_productCard),
          ],
        ),
      ),
    ));
  }

  Widget _productCard(StaffCatalogProduct product) {
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
                        product.name,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${product.categoryName ?? 'Uncategorised'} · '
                        '/${product.slug}',
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Chip(label: Text(product.status)),
                    IconButton(
                      tooltip: 'Edit product',
                      onPressed: () async {
                        await context.push(
                          '/staff/catalog/products/${product.id}',
                        );
                        if (mounted) {
                          await _load();
                        }
                      },
                      icon: const Icon(Icons.edit_outlined),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 14,
              runSpacing: 6,
              children: <Widget>[
                Text('Quantity ${product.totalQuantity}'),
                Text('Reserved ${product.totalReserved}'),
                Text('Available ${product.availableStock}'),
                Text('${product.variants.length} SKU'),
              ],
            ),
            const SizedBox(height: 12),
            ...product.variants.map(
              (variant) => _variantRow(product, variant),
            ),
          ],
        ),
      ),
    );
  }

  Widget _variantRow(
    StaffCatalogProduct product,
    StaffCatalogVariant variant,
  ) {
    final busy = _busyVariantId == variant.id;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  '${variant.sku} · ${variant.name}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Text(_money(variant)),
            ],
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 12,
            runSpacing: 4,
            children: <Widget>[
              Text('Qty ${variant.quantity}'),
              Text('Reserved ${variant.reserved}'),
              Text('Available ${variant.available}'),
              Text(variant.isActive ? 'ACTIVE' : 'INACTIVE'),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              FilledButton(
                onPressed: busy ? null : () => _adjust(product, variant),
                child: const Text('Adjust stock'),
              ),
              TextButton(
                onPressed: busy ? null : () => _history(product, variant),
                child: const Text('History'),
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
      ),
    );
  }
}

class _AdjustmentDraft {
  const _AdjustmentDraft({required this.delta, required this.reason});

  final int delta;
  final String reason;
}

class _InventoryAdjustmentDialog extends StatefulWidget {
  const _InventoryAdjustmentDialog({
    required this.productName,
    required this.variant,
  });

  final String productName;
  final StaffCatalogVariant variant;

  @override
  State<_InventoryAdjustmentDialog> createState() =>
      _InventoryAdjustmentDialogState();
}

class _InventoryAdjustmentDialogState
    extends State<_InventoryAdjustmentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _deltaController = TextEditingController();
  final _reasonController = TextEditingController();

  @override
  void dispose() {
    _deltaController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Adjust inventory'),
      content: SizedBox(
        width: 430,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  '${widget.productName}\n'
                  '${widget.variant.sku} · ${widget.variant.name}',
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 12,
                  children: <Widget>[
                    Text('Qty ${widget.variant.quantity}'),
                    Text('Reserved ${widget.variant.reserved}'),
                    Text('Available ${widget.variant.available}'),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _deltaController,
                  keyboardType:
                      const TextInputType.numberWithOptions(signed: true),
                  decoration: const InputDecoration(
                    labelText: 'Adjustment',
                    hintText: 'e.g. 10 or -2',
                  ),
                  validator: (value) {
                    final delta = int.tryParse(value?.trim() ?? '');
                    if (delta == null) return 'Enter a whole number.';
                    if (delta == 0) return 'Adjustment cannot be zero.';
                    if (widget.variant.quantity + delta <
                        widget.variant.reserved) {
                      return 'Quantity cannot go below reserved stock.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _reasonController,
                  minLines: 2,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Reason',
                    hintText: 'Stock count correction',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Reason is required.';
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
              _AdjustmentDraft(
                delta: int.parse(_deltaController.text.trim()),
                reason: _reasonController.text.trim(),
              ),
            );
          },
          child: const Text('Apply adjustment'),
        ),
      ],
    );
  }
}

class _InventoryHistoryDialog extends StatefulWidget {
  const _InventoryHistoryDialog({
    required this.repository,
    required this.productName,
    required this.variant,
  });

  final StaffRepository repository;
  final String productName;
  final StaffCatalogVariant variant;

  @override
  State<_InventoryHistoryDialog> createState() =>
      _InventoryHistoryDialogState();
}

class _InventoryHistoryDialogState extends State<_InventoryHistoryDialog> {
  late final Future<List<StaffInventoryAdjustment>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.getInventoryHistory(widget.variant.id);
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
    return AlertDialog(
      title: const Text('Inventory history'),
      content: SizedBox(
        width: 540,
        height: 430,
        child: FutureBuilder<List<StaffInventoryAdjustment>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return const Center(
                child: Text('Unable to load inventory history.'),
              );
            }
            final history = snapshot.data ?? const <StaffInventoryAdjustment>[];
            if (history.isEmpty) {
              return const Center(child: Text('No adjustments recorded yet.'));
            }
            return ListView.separated(
              itemCount: history.length,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (context, index) {
                final item = history[index];
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    '${item.delta > 0 ? '+' : ''}${item.delta} · '
                    '${item.previousQuantity} → ${item.newQuantity}',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${item.reason}\n'
                    '${item.actor.displayName} · ${_date(item.createdAt)}',
                  ),
                );
              },
            );
          },
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }
}
