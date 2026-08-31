import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/product_repository.dart';
import '../domain/product.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ApiProductRepository(ref.watch(apiClientProvider));
});

final productsProvider = FutureProvider<List<Product>>((ref) {
  return ref.watch(productRepositoryProvider).getProducts();
});

final productProvider = FutureProvider.family<Product?, String>((ref, id) {
  return ref.watch(productRepositoryProvider).getProductById(id);
});

final productSearchQueryProvider = StateProvider<String>((ref) => '');
final selectedProductCategoryProvider = StateProvider<String?>((ref) => null);

enum ProductSort {
  newest,
  priceLowToHigh,
  priceHighToLow,
  name,
}

final productSortProvider =
    StateProvider<ProductSort>((ref) => ProductSort.newest);

final productCategoriesProvider = Provider<AsyncValue<List<String>>>((ref) {
  return ref.watch(productsProvider).whenData((products) {
    final categories = products
        .map((product) => product.category.trim())
        .where((category) => category.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    return categories;
  });
});

final filteredProductsProvider = Provider<AsyncValue<List<Product>>>((ref) {
  final query = ref.watch(productSearchQueryProvider).trim().toLowerCase();
  final selectedCategory = ref.watch(selectedProductCategoryProvider);
  final sort = ref.watch(productSortProvider);

  return ref.watch(productsProvider).whenData((products) {
    final filtered = products.where((product) {
      final matchesCategory =
          selectedCategory == null || product.category == selectedCategory;

      if (!matchesCategory) return false;
      if (query.isEmpty) return true;

      final haystack = <String>[
        product.name,
        product.description,
        product.category,
        ...product.variants.expand(
          (variant) => <String>[variant.name, variant.sku],
        ),
      ].join(' ').toLowerCase();

      return haystack.contains(query);
    }).toList(growable: true);

    switch (sort) {
      case ProductSort.newest:
        break;
      case ProductSort.priceLowToHigh:
        filtered.sort((a, b) => a.price.compareTo(b.price));
      case ProductSort.priceHighToLow:
        filtered.sort((a, b) => b.price.compareTo(a.price));
      case ProductSort.name:
        filtered.sort(
          (a, b) => a.name.toLowerCase().compareTo(
                b.name.toLowerCase(),
              ),
        );
    }

    return List<Product>.unmodifiable(filtered);
  });
});
