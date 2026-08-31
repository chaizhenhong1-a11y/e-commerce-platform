import '../../../core/network/api_client.dart';
import '../domain/product.dart';

abstract interface class ProductRepository {
  Future<List<Product>> getProducts();
  Future<Product?> getProductById(String id);
}

class ApiProductRepository implements ProductRepository {
  ApiProductRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<Product>> getProducts() async {
    final response = await _apiClient.dio.get<List<dynamic>>('/products');
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
