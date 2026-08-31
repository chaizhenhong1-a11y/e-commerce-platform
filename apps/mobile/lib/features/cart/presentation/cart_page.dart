import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../domain/customer_cart.dart';
import 'cart_providers.dart';

class CartPage extends ConsumerWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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

class _CartContent extends ConsumerWidget {
  const _CartContent({required this.cart});

  final CustomerCart cart;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      children: <Widget>[
        ...cart.items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _CartItemCard(item: item),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    '${cart.totalQuantity} item${cart.totalQuantity == 1 ? '' : 's'}',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
                Text(
                  'RM ${cart.subtotal.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (cart.issueCount > 0) ...<Widget>[
          Text(
            '${cart.issueCount} item${cart.issueCount == 1 ? '' : 's'} '
            'need attention before checkout.',
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
        ],
        FilledButton.icon(
          onPressed: cart.canCheckout ? () => context.push('/checkout') : null,
          icon: const Icon(Icons.lock_outline_rounded),
          label: const Padding(
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Text('Checkout'),
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
    if (_busy || quantity < 1) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(cartRepositoryProvider)
          .updateItem(widget.item.id, quantity);
      ref.invalidate(customerCartProvider);
    } on DioException catch (error) {
      if (mounted) {
        _showMessage(_messageFrom(error, 'Unable to update cart.'));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _remove() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(cartRepositoryProvider).removeItem(widget.item.id);
      ref.invalidate(customerCartProvider);
    } on DioException catch (error) {
      if (mounted) {
        _showMessage(_messageFrom(error, 'Unable to remove item.'));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 76,
                height: 76,
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
                  Text(
                    item.productName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('${item.variantName} · ${item.sku}'),
                  const SizedBox(height: 5),
                  Text(
                    item.issue ?? '${item.availableStock} available',
                    style: TextStyle(
                      color: item.issue == null
                          ? Theme.of(context).colorScheme.onSurfaceVariant
                          : Theme.of(context).colorScheme.error,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'RM ${item.price.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: <Widget>[
                      IconButton.filledTonal(
                        onPressed: _busy || item.quantity <= 1
                            ? null
                            : () => _update(item.quantity - 1),
                        icon: const Icon(Icons.remove_rounded),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          '${item.quantity}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      IconButton.filledTonal(
                        onPressed: _busy ||
                                item.quantity >= item.availableStock ||
                                item.quantity >= 99
                            ? null
                            : () => _update(item.quantity + 1),
                        icon: const Icon(Icons.add_rounded),
                      ),
                      const Spacer(),
                      IconButton(
                        tooltip: 'Remove',
                        onPressed: _busy ? null : _remove,
                        icon: const Icon(Icons.delete_outline),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(28),
      children: <Widget>[
        const SizedBox(height: 90),
        const Icon(Icons.shopping_bag_outlined, size: 56),
        const SizedBox(height: 16),
        Text(
          'Your cart is empty',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Items added while signed in sync across the website and app.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
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
      padding: const EdgeInsets.all(28),
      children: const <Widget>[
        SizedBox(height: 120),
        Center(child: CircularProgressIndicator()),
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
      padding: const EdgeInsets.all(28),
      children: <Widget>[
        const SizedBox(height: 80),
        const Icon(Icons.cloud_off_outlined, size: 52),
        const SizedBox(height: 16),
        Text(
          'Could not load cart',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 20),
        FilledButton.tonal(
          onPressed: onRetry,
          child: const Text('Try again'),
        ),
      ],
    );
  }
}

class _CartImageFallback extends StatelessWidget {
  const _CartImageFallback();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: const Center(child: Icon(Icons.inventory_2_outlined)),
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
