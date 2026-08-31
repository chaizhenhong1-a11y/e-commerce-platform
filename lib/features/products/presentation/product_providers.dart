import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/product_repository.dart';
import '../domain/product.dart';

final Provider<ProductRepository> productRepositoryProvider =
    Provider<ProductRepository>((ref) => MockProductRepository());

final FutureProvider<List<Product>> productsProvider =
    FutureProvider<List<Product>>((ref) {
  return ref.watch(productRepositoryProvider).getProducts();
});

final FutureProviderFamily<Product?, String> productProvider =
    FutureProvider.family<Product?, String>((ref, id) {
  return ref.watch(productRepositoryProvider).getProductById(id);
});
