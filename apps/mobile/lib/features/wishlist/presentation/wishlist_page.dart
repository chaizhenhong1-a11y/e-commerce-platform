import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../products/presentation/product_providers.dart';
import '../../products/presentation/widgets/product_card.dart';
import 'wishlist_providers.dart';

class WishlistPage extends ConsumerStatefulWidget {
  const WishlistPage({super.key});

  @override
  ConsumerState<WishlistPage> createState() => _WishlistPageState();
}

class _WishlistPageState extends ConsumerState<WishlistPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(wishlistProductIdsProvider.notifier).refreshFromServer();
    });
  }

  Future<void> _refresh() async {
    await ref.read(wishlistProductIdsProvider.notifier).refreshFromServer();
    ref.invalidate(productsProvider);
    await ref.read(productsProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final wishlist = ref.watch(wishlistProductIdsProvider);
    final products = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Wishlist'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh wishlist',
            onPressed: _refresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: wishlist.when(
          loading: () => const _ScrollableState(
            child: CircularProgressIndicator(),
          ),
          error: (error, stackTrace) => _ScrollableState(
            child: FilledButton.tonal(
              onPressed: _refresh,
              child: const Text('Try again'),
            ),
          ),
          data: (ids) => products.when(
            loading: () => const _ScrollableState(
              child: CircularProgressIndicator(),
            ),
            error: (error, stackTrace) => _ScrollableState(
              child: FilledButton.tonal(
                onPressed: _refresh,
                child: const Text('Try again'),
              ),
            ),
            data: (catalog) {
              final saved = catalog
                  .where((product) => ids.contains(product.id))
                  .toList(growable: false);

              if (saved.isEmpty) {
                return const _EmptyWishlist();
              }

              return LayoutBuilder(
                builder: (context, constraints) {
                  final count = constraints.maxWidth >= 1100
                      ? 4
                      : constraints.maxWidth >= 760
                          ? 3
                          : 2;

                  return GridView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(18, 14, 18, 30),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: count,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio:
                          constraints.maxWidth < 520 ? 0.68 : 0.76,
                    ),
                    itemCount: saved.length,
                    itemBuilder: (context, index) {
                      final product = saved[index];
                      return ProductCard(
                        product: product,
                        onTap: () => context.push('/products/${product.id}'),
                      );
                    },
                  );
                },
              );
            },
          ),
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
          height: MediaQuery.sizeOf(context).height * 0.62,
          child: Center(child: child),
        ),
      ],
    );
  }
}

class _EmptyWishlist extends StatelessWidget {
  const _EmptyWishlist();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: <Widget>[
        SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.62,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  const Icon(Icons.favorite_border_rounded, size: 56),
                  const SizedBox(height: 16),
                  Text(
                    'Nothing saved yet',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap the heart on a product to keep it here while you shop.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
