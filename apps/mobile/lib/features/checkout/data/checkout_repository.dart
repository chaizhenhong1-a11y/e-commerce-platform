import '../../../core/network/api_client.dart';
import '../domain/checkout_order.dart';

class CheckoutRepository {
  CheckoutRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<CheckoutOrder> createOrder(CheckoutInput input) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/checkout',
      data: input.toJson(),
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Checkout response was empty.');
    }
    return CheckoutOrder.fromJson(data);
  }

  Future<PaymentSession> createPayment({
    required String orderNumber,
    required String provider,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/payments',
      data: <String, dynamic>{
        'orderNumber': orderNumber,
        'provider': provider,
      },
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Payment response was empty.');
    }
    return PaymentSession.fromJson(data);
  }

  Future<void> confirmDevelopmentPayment(String paymentId) async {
    await _apiClient.dio.post<void>(
      '/payments/$paymentId/dev-confirm',
    );
  }
}
