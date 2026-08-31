import '../../../core/network/api_client.dart';

abstract interface class WishlistRepository {
  Future<Set<String>> getProductIds();
  Future<void> add(String productId);
  Future<void> remove(String productId);
}

class ApiWishlistRepository implements WishlistRepository {
  ApiWishlistRepository(this._apiClient);
  final ApiClient _apiClient;

  @override
  Future<Set<String>> getProductIds() async {
    final response =
        await _apiClient.dio.get<Map<String, dynamic>>('/wishlist');
    final values =
        response.data?['productIds'] as List<dynamic>? ?? const <dynamic>[];
    return values.map((value) => value.toString()).toSet();
  }

  @override
  Future<void> add(String productId) async {
    await _apiClient.dio.post<void>('/wishlist/$productId');
  }

  @override
  Future<void> remove(String productId) async {
    await _apiClient.dio.delete<void>('/wishlist/$productId');
  }
}
