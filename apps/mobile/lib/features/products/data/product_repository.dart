import '../../../core/network/api_client.dart';
import '../domain/product.dart';

class ProductCatalogQuery {
  const ProductCatalogQuery({
    this.query,
    this.category,
    this.sort = 'newest',
    this.minPrice,
    this.maxPrice,
    this.inStock = false,
  });

  final String? query;
  final String? category;
  final String sort;
  final double? minPrice;
  final double? maxPrice;
  final bool inStock;
}

abstract interface class ProductRepository {
  Future<List<Product>> getProducts([
    ProductCatalogQuery filters = const ProductCatalogQuery(),
  ]);
  Future<Product?> getProductById(String id);
}

class ApiProductRepository implements ProductRepository {
  ApiProductRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<Product>> getProducts([
    ProductCatalogQuery filters = const ProductCatalogQuery(),
  ]) async {
    final queryParameters = <String, dynamic>{
      if (filters.query?.trim().isNotEmpty ?? false) 'q': filters.query!.trim(),
      if (filters.category?.trim().isNotEmpty ?? false)
        'category': filters.category!.trim(),
      if (filters.sort != 'newest') 'sort': filters.sort,
      if (filters.minPrice != null) 'minPrice': filters.minPrice,
      if (filters.maxPrice != null) 'maxPrice': filters.maxPrice,
      if (filters.inStock) 'inStock': true,
    };
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/products',
      queryParameters: queryParameters,
    );
    final data = response.data ?? const <dynamic>[];

    return data
        .map((item) => Product.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  @override
  Future<Product?> getProductById(String id) async {
    final products = await getProducts();
    for (final product in products) {
      if (product.id == id) {
        return product;
      }
    }
    return null;
  }
}
