import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/product_repository.dart';
import '../domain/product.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ApiProductRepository(ref.watch(apiClientProvider));
});

final productSearchQueryProvider = StateProvider<String>((ref) => '');
final selectedProductCategoryProvider = StateProvider<String?>((ref) => null);
final productMinPriceProvider = StateProvider<double?>((ref) => null);
final productMaxPriceProvider = StateProvider<double?>((ref) => null);
final productInStockOnlyProvider = StateProvider<bool>((ref) => false);

enum ProductSort { newest, priceLowToHigh, priceHighToLow, name }

extension ProductSortApiValue on ProductSort {
  String get apiValue {
    switch (this) {
      case ProductSort.newest:
        return 'newest';
      case ProductSort.priceLowToHigh:
        return 'price-asc';
      case ProductSort.priceHighToLow:
        return 'price-desc';
      case ProductSort.name:
        return 'name';
    }
  }
}

final productSortProvider =
    StateProvider<ProductSort>((ref) => ProductSort.newest);

class ProductCatalogState {
  const ProductCatalogState({
    required this.items,
    required this.total,
    required this.page,
    required this.hasMore,
    this.isLoadingMore = false,
  });

  final List<Product> items;
  final int total;
  final int page;
  final bool hasMore;
  final bool isLoadingMore;

  ProductCatalogState copyWith({
    List<Product>? items,
    int? total,
    int? page,
    bool? hasMore,
    bool? isLoadingMore,
  }) {
    return ProductCatalogState(
      items: items ?? this.items,
      total: total ?? this.total,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}

class ProductsNotifier extends AsyncNotifier<ProductCatalogState> {
  static const _pageSize = 24;

  ProductCatalogQuery _query({required int page}) {
    final query = ref.read(productSearchQueryProvider).trim();
    final category = ref.read(selectedProductCategoryProvider);
    final sort = ref.read(productSortProvider);
    final minPrice = ref.read(productMinPriceProvider);
    final maxPrice = ref.read(productMaxPriceProvider);
    final inStockOnly = ref.read(productInStockOnlyProvider);

    return ProductCatalogQuery(
      query: query.isEmpty ? null : query,
      category: category,
      sort: sort.apiValue,
      minPrice: minPrice,
      maxPrice: maxPrice,
      inStock: inStockOnly,
      page: page,
      limit: _pageSize,
    );
  }

  @override
  Future<ProductCatalogState> build() async {
    ref.watch(productSearchQueryProvider);
    ref.watch(selectedProductCategoryProvider);
    ref.watch(productSortProvider);
    ref.watch(productMinPriceProvider);
    ref.watch(productMaxPriceProvider);
    ref.watch(productInStockOnlyProvider);

    final page = await ref
        .watch(productRepositoryProvider)
        .getProductPage(_query(page: 1));
    return ProductCatalogState(
      items: page.items,
      total: page.total,
      page: page.page,
      hasMore: page.hasMore,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading<ProductCatalogState>();
    state = await AsyncValue.guard(() async {
      final page = await ref
          .read(productRepositoryProvider)
          .getProductPage(_query(page: 1));
      return ProductCatalogState(
        items: page.items,
        total: page.total,
        page: page.page,
        hasMore: page.hasMore,
      );
    });
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || current.isLoadingMore || !current.hasMore) return;

    state = AsyncData(current.copyWith(isLoadingMore: true));
    try {
      final nextPage = await ref
          .read(productRepositoryProvider)
          .getProductPage(_query(page: current.page + 1));
      final ids = current.items.map((item) => item.id).toSet();
      final appended = nextPage.items
          .where((item) => ids.add(item.id))
          .toList(growable: false);
      state = AsyncData(
        ProductCatalogState(
          items: <Product>[...current.items, ...appended],
          total: nextPage.total,
          page: nextPage.page,
          hasMore: nextPage.hasMore,
        ),
      );
    } catch (_) {
      state = AsyncData(current.copyWith(isLoadingMore: false));
    }
  }
}

final productsProvider =
    AsyncNotifierProvider<ProductsNotifier, ProductCatalogState>(
  ProductsNotifier.new,
);

final productCatalogMetadataProvider =
    FutureProvider<ProductCatalogMetadata>((ref) {
  return ref.watch(productRepositoryProvider).getCatalogMetadata();
});

final productProvider = FutureProvider.family<Product?, String>((ref, id) {
  return ref.watch(productRepositoryProvider).getProductById(id);
});

final productCategoriesProvider = Provider<AsyncValue<List<String>>>((ref) {
  return ref.watch(productCatalogMetadataProvider).whenData(
        (metadata) => metadata.categories,
      );
});

final filteredProductsProvider = Provider<AsyncValue<List<Product>>>((ref) {
  return ref.watch(productsProvider).whenData((state) => state.items);
});
