import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../products/presentation/product_providers.dart';
import '../../products/presentation/widgets/product_card.dart';
import '../../wishlist/presentation/wishlist_providers.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    if (_scrollController.position.extentAfter > 700) return;
    ref.read(productsProvider.notifier).loadMore();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(productCatalogMetadataProvider);
    await Future.wait<void>(<Future<void>>[
      ref.read(productsProvider.notifier).refresh(),
      ref.read(productCatalogMetadataProvider.future).then((_) {}),
      ref.read(wishlistProductIdsProvider.notifier).refreshFromServer(),
    ]);
  }

  void _clearSearch() {
    _searchDebounce?.cancel();
    _searchController.clear();
    ref.read(productSearchQueryProvider.notifier).state = '';
  }

  void _queueSearch(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      ref.read(productSearchQueryProvider.notifier).state = value;
    });
  }

  void _clearCatalogFilters() {
    _clearSearch();
    ref.read(selectedProductCategoryProvider.notifier).state = null;
    ref.read(productSortProvider.notifier).state = ProductSort.newest;
    ref.read(productMinPriceProvider.notifier).state = null;
    ref.read(productMaxPriceProvider.notifier).state = null;
    ref.read(productInStockOnlyProvider.notifier).state = false;
  }

  Future<void> _openCatalogFilters() async {
    final currentMin = ref.read(productMinPriceProvider);
    final currentMax = ref.read(productMaxPriceProvider);
    final currentInStock = ref.read(productInStockOnlyProvider);
    final catalogMetadata =
        ref.read(productCatalogMetadataProvider).valueOrNull;

    final minController = TextEditingController(
      text: currentMin?.toStringAsFixed(2) ?? '',
    );
    final maxController = TextEditingController(
      text: currentMax?.toStringAsFixed(2) ?? '',
    );
    var inStockOnly = currentInStock;
    String? validationMessage;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            void apply() {
              final min = minController.text.trim().isEmpty
                  ? null
                  : double.tryParse(minController.text.trim());
              final max = maxController.text.trim().isEmpty
                  ? null
                  : double.tryParse(maxController.text.trim());

              if ((minController.text.trim().isNotEmpty && min == null) ||
                  (maxController.text.trim().isNotEmpty && max == null)) {
                setSheetState(() {
                  validationMessage = 'Enter a valid price.';
                });
                return;
              }
              if ((min != null && min < 0) || (max != null && max < 0)) {
                setSheetState(() {
                  validationMessage = 'Price cannot be negative.';
                });
                return;
              }
              if (min != null && max != null && min > max) {
                setSheetState(() {
                  validationMessage =
                      'Minimum price cannot be higher than maximum price.';
                });
                return;
              }

              ref.read(productMinPriceProvider.notifier).state = min;
              ref.read(productMaxPriceProvider.notifier).state = max;
              ref.read(productInStockOnlyProvider.notifier).state = inStockOnly;
              Navigator.of(sheetContext).pop();
            }

            return SafeArea(
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  20,
                  8,
                  20,
                  20 + MediaQuery.viewInsetsOf(context).bottom,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Filter products',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                    if (catalogMetadata?.minPrice != null &&
                        catalogMetadata?.maxPrice != null) ...<Widget>[
                      const SizedBox(height: 6),
                      Text(
                        'Catalog range: \$${catalogMetadata!.minPrice!.toStringAsFixed(2)} – \$${catalogMetadata.maxPrice!.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: TextField(
                            controller: minController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Min price',
                              prefixText: 'RM ',
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: maxController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Max price',
                              prefixText: 'RM ',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 7),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('In-stock products only'),
                      subtitle: const Text(
                        'Uses live sellable stock after reservations.',
                      ),
                      value: inStockOnly,
                      onChanged: (value) {
                        setSheetState(() {
                          inStockOnly = value;
                          validationMessage = null;
                        });
                      },
                    ),
                    if (validationMessage != null) ...<Widget>[
                      const SizedBox(height: 4),
                      Text(
                        validationMessage!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    Row(
                      children: <Widget>[
                        TextButton(
                          onPressed: () {
                            minController.clear();
                            maxController.clear();
                            setSheetState(() {
                              inStockOnly = false;
                              validationMessage = null;
                            });
                          },
                          child: const Text('Reset'),
                        ),
                        const Spacer(),
                        FilledButton(
                          onPressed: apply,
                          child: const Text('Apply filters'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    minController.dispose();
    maxController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final products = ref.watch(filteredProductsProvider);
    final catalogState = ref.watch(productsProvider).valueOrNull;
    final categories = ref.watch(productCategoriesProvider);
    final selectedCategory = ref.watch(selectedProductCategoryProvider);
    final query = ref.watch(productSearchQueryProvider);
    final sort = ref.watch(productSortProvider);
    final minPrice = ref.watch(productMinPriceProvider);
    final maxPrice = ref.watch(productMaxPriceProvider);
    final inStockOnly = ref.watch(productInStockOnlyProvider);
    final activeAdvancedFilterCount = (minPrice == null ? 0 : 1) +
        (maxPrice == null ? 0 : 1) +
        (inStockOnly ? 1 : 0);
    final hasAnyFilter = query.isNotEmpty ||
        selectedCategory != null ||
        sort != ProductSort.newest ||
        activeAdvancedFilterCount > 0;
    final wishlist = ref.watch(wishlistProductIdsProvider);
    final wishlistIds = wishlist.valueOrNull ?? <String>{};
    final wishlistCount = ref.watch(wishlistCountProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 20,
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            DecoratedBox(
              decoration:
                  BoxDecoration(color: AppTheme.accent, shape: BoxShape.circle),
              child: SizedBox(width: 12, height: 12),
            ),
            SizedBox(width: 8),
            Text('Elvane', style: TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
        actions: <Widget>[
          Badge(
            isLabelVisible: wishlistCount > 0,
            label: Text('$wishlistCount'),
            child: IconButton(
              tooltip: 'Wishlist',
              onPressed: () => context.push('/wishlist'),
              icon: const Icon(Icons.favorite_border_rounded),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: <Widget>[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              sliver: SliverToBoxAdapter(
                child: _HeroBanner(
                  onShopNow: () {
                    FocusScope.of(context).unfocus();
                    ref
                        .read(
                          selectedProductCategoryProvider.notifier,
                        )
                        .state = null;
                  },
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(
                child: SearchBar(
                  controller: _searchController,
                  hintText: 'Search products',
                  leading: const Icon(Icons.search_rounded),
                  trailing: <Widget>[
                    if (query.isNotEmpty)
                      IconButton(
                        tooltip: 'Clear search',
                        onPressed: _clearSearch,
                        icon: const Icon(Icons.close_rounded),
                      ),
                  ],
                  onChanged: _queueSearch,
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(
                child: _CategoryStrip(
                  categories: categories,
                  selectedCategory: selectedCategory,
                  onSelected: (category) {
                    ref
                        .read(
                          selectedProductCategoryProvider.notifier,
                        )
                        .state = category;
                  },
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
              sliver: SliverToBoxAdapter(
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        query.isNotEmpty
                            ? 'Search results'
                            : selectedCategory ?? 'Shop all',
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w900,
                                ),
                      ),
                    ),
                    if (catalogState != null)
                      Text(
                        '${catalogState.items.length} of ${catalogState.total}',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    const SizedBox(width: 8),
                    Badge(
                      isLabelVisible: activeAdvancedFilterCount > 0,
                      label: Text('$activeAdvancedFilterCount'),
                      child: IconButton(
                        tooltip: 'Filter products',
                        onPressed: _openCatalogFilters,
                        icon: const Icon(Icons.tune_rounded),
                      ),
                    ),
                    PopupMenuButton<ProductSort>(
                      tooltip: 'Sort products',
                      initialValue: sort,
                      onSelected: (value) {
                        ref.read(productSortProvider.notifier).state = value;
                      },
                      itemBuilder: (context) =>
                          const <PopupMenuEntry<ProductSort>>[
                        PopupMenuItem(
                          value: ProductSort.newest,
                          child: Text('Newest'),
                        ),
                        PopupMenuItem(
                          value: ProductSort.priceLowToHigh,
                          child: Text('Price: low to high'),
                        ),
                        PopupMenuItem(
                          value: ProductSort.priceHighToLow,
                          child: Text('Price: high to low'),
                        ),
                        PopupMenuItem(
                          value: ProductSort.name,
                          child: Text('Name: A–Z'),
                        ),
                      ],
                      icon: const Icon(Icons.sort_rounded),
                    ),
                  ],
                ),
              ),
            ),
            products.when(
              loading: () => const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stackTrace) => SliverFillRemaining(
                hasScrollBody: false,
                child: _ProductsError(
                  onRetry: _refresh,
                ),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyProducts(
                      hasFilter: hasAnyFilter,
                      onReset: _clearCatalogFilters,
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                  sliver: SliverLayoutBuilder(
                    builder: (context, constraints) {
                      final width = constraints.crossAxisExtent;
                      final count = width >= 1100
                          ? 4
                          : width >= 700
                              ? 3
                              : 2;
                      final childAspectRatio = width >= 1100
                          ? 0.80
                          : width >= 700
                              ? 0.76
                              : 0.68;

                      return SliverGrid(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final product = items[index];
                            return ProductCard(
                              product: product,
                              isWishlisted: wishlistIds.contains(product.id),
                              onWishlistTap: () async {
                                try {
                                  await ref
                                      .read(wishlistProductIdsProvider.notifier)
                                      .toggle(product.id);
                                } on StateError {
                                  if (!context.mounted) return;
                                  context.push('/sign-in?returnTo=%2F');
                                }
                              },
                              onTap: () => context.push(
                                '/products/${product.id}',
                              ),
                            );
                          },
                          childCount: items.length,
                        ),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: count,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: childAspectRatio,
                        ),
                      );
                    },
                  ),
                );
              },
            ),
            if (catalogState?.isLoadingMore ?? false)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.only(bottom: 28),
                  child: Center(child: CircularProgressIndicator()),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.onShopNow});

  final VoidCallback onShopNow;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 142),
      padding: const EdgeInsets.fromLTRB(18, 14, 14, 14),
      decoration: BoxDecoration(
        color: AppTheme.brand,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Stack(
        children: <Widget>[
          Positioned(
            right: -28,
            top: -42,
            child: Container(
              width: 128,
              height: 128,
              decoration: const BoxDecoration(
                color: AppTheme.accent,
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: 28,
            bottom: 14,
            child: Transform.rotate(
              angle: -0.12,
              child: const Icon(
                Icons.shopping_bag_rounded,
                size: 72,
                color: AppTheme.brand,
              ),
            ),
          ),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text(
                  'NEW SEASON · LIVE STOCK',
                  style: TextStyle(
                    color: AppTheme.accent,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  'Find your next\neveryday favorite.',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        height: 1.02,
                      ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Clean picks, real inventory and secure checkout.',
                  style: TextStyle(color: Color(0xFFCFCFCA), height: 1.4),
                ),
                const SizedBox(height: 10),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.accent,
                    foregroundColor: AppTheme.brand,
                  ),
                  onPressed: onShopNow,
                  child: const Text('Explore collection'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryStrip extends StatelessWidget {
  const _CategoryStrip({
    required this.categories,
    required this.selectedCategory,
    required this.onSelected,
  });

  final AsyncValue<List<String>> categories;
  final String? selectedCategory;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    return categories.when(
      loading: () => const SizedBox(
        height: 42,
        child: Align(
          alignment: Alignment.centerLeft,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
      error: (error, stackTrace) => const SizedBox.shrink(),
      data: (items) => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: <Widget>[
            ChoiceChip(
              label: const Text('All'),
              selected: selectedCategory == null,
              onSelected: (_) => onSelected(null),
            ),
            ...items.map(
              (category) => Padding(
                padding: const EdgeInsets.only(left: 8),
                child: ChoiceChip(
                  label: Text(category),
                  selected: selectedCategory == category,
                  onSelected: (_) => onSelected(category),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductsError extends StatelessWidget {
  const _ProductsError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          const Icon(Icons.cloud_off_outlined, size: 52),
          const SizedBox(height: 16),
          Text(
            'Could not load products',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Check the API connection and try again.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          FilledButton.tonal(
            onPressed: () => onRetry(),
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}

class _EmptyProducts extends StatelessWidget {
  const _EmptyProducts({
    required this.hasFilter,
    required this.onReset,
  });

  final bool hasFilter;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          const Icon(Icons.search_off_rounded, size: 52),
          const SizedBox(height: 16),
          Text(
            hasFilter ? 'No matching products' : 'No products yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          ),
          if (hasFilter) ...<Widget>[
            const SizedBox(height: 14),
            TextButton(
              onPressed: onReset,
              child: const Text('Clear filters'),
            ),
          ],
        ],
      ),
    );
  }
}
