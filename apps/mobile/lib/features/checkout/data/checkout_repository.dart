import 'package:flutter/foundation.dart';

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

  Future<CouponValidation> validateCoupon({
    required String sessionId,
    required String couponCode,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/coupons/validate',
      data: <String, dynamic>{
        'sessionId': sessionId,
        'couponCode': couponCode,
      },
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Coupon response was empty.');
    }
    return CouponValidation.fromJson(data);
  }

  Future<AutomaticPromotionPreview?> previewAutomaticPromotion({
    required String sessionId,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/promotions/preview',
      data: <String, dynamic>{'sessionId': sessionId},
    );
    final data = response.data?['automaticPromotion'];
    if (data is! Map<String, dynamic>) return null;
    return AutomaticPromotionPreview.fromJson(data);
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
        if (kIsWeb) 'returnBaseUrl': Uri.base.origin,
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
