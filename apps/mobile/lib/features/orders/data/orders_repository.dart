import '../../../core/network/api_client.dart';
import '../domain/customer_order.dart';
import '../domain/order_details.dart';

class OrdersRepository {
  OrdersRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<CustomerOrder>> getMyOrders() async {
    final response = await _apiClient.dio.get<List<dynamic>>('/orders/me');

    final data = response.data ?? const <dynamic>[];
    return data
        .map((item) => CustomerOrder.fromJson(
              item as Map<String, dynamic>,
            ))
        .toList(growable: false);
  }

  Future<OrderDetails> getOrderDetails(String orderNumber) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/orders/$orderNumber/status',
    );

    final data = response.data;
    if (data == null) {
      throw StateError('Order details are unavailable.');
    }

    return OrderDetails.fromJson(data);
  }

  Future<void> cancelOrder(String orderNumber) async {
    await _apiClient.dio.post<void>(
      '/orders/$orderNumber/cancel',
    );
  }

  Future<void> requestReturn(
    String orderNumber,
    List<Map<String, dynamic>> items,
  ) async {
    await _apiClient.dio.post<void>(
      '/orders/$orderNumber/returns',
      data: <String, dynamic>{
        'reason': 'CHANGED_MIND',
        'items': items,
      },
    );
  }

  Future<void> requestRefund(String orderNumber) async {
    await _apiClient.dio.post<void>(
      '/orders/$orderNumber/refunds',
      data: <String, dynamic>{'reason': 'CHANGED_MIND'},
    );
  }
}
