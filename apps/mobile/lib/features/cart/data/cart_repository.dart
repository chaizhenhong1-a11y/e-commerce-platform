import 'dart:math';

import '../../../core/network/api_client.dart';
import '../domain/customer_cart.dart';

class CartRepository {
  CartRepository(this._apiClient) : _sessionId = _createSessionId();

  final ApiClient _apiClient;
  final String _sessionId;

  Future<CustomerCart> getCart() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/cart/$_sessionId',
    );
    return _readCart(response.data);
  }

  Future<CustomerCart> addItem(
    String variantId, {
    int quantity = 1,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/cart/$_sessionId/items',
      data: <String, dynamic>{
        'variantId': variantId,
        'quantity': quantity,
      },
    );
    return _readCart(response.data);
  }

  Future<CustomerCart> updateItem(
    String itemId,
    int quantity,
  ) async {
    final response = await _apiClient.dio.patch<Map<String, dynamic>>(
      '/cart/$_sessionId/items/$itemId',
      data: <String, dynamic>{'quantity': quantity},
    );
    return _readCart(response.data);
  }

  Future<CustomerCart> removeItem(String itemId) async {
    final response = await _apiClient.dio.delete<Map<String, dynamic>>(
      '/cart/$_sessionId/items/$itemId',
    );
    return _readCart(response.data);
  }

  CustomerCart _readCart(Map<String, dynamic>? data) {
    if (data == null) {
      throw StateError('Cart response was empty.');
    }
    return CustomerCart.fromJson(data);
  }

  static String _createSessionId() {
    final random = Random.secure();
    final bytes = List<int>.generate(12, (_) => random.nextInt(256));
    final suffix =
        bytes.map((value) => value.toRadixString(16).padLeft(2, '0')).join();
    return 'mobile-${DateTime.now().microsecondsSinceEpoch}-$suffix';
  }
}
