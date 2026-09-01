class CheckoutOrder {
  const CheckoutOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.currency,
    required this.subtotalCents,
    required this.shippingCents,
    required this.discountCents,
    required this.totalCents,
    this.couponCode,
    this.couponName,
    required this.reservationExpiresAt,
  });

  factory CheckoutOrder.fromJson(Map<String, dynamic> json) {
    return CheckoutOrder(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String,
      paymentStatus: json['paymentStatus'] as String,
      currency: json['currency'] as String? ?? 'MYR',
      subtotalCents: json['subtotalCents'] as int,
      shippingCents: json['shippingCents'] as int,
      discountCents: json['discountCents'] as int? ?? 0,
      totalCents: json['totalCents'] as int,
      couponCode: json['couponCode'] as String?,
      couponName: json['couponName'] as String?,
      reservationExpiresAt:
          DateTime.parse(json['reservationExpiresAt'] as String).toLocal(),
    );
  }

  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String currency;
  final int subtotalCents;
  final int shippingCents;
  final int discountCents;
  final int totalCents;
  final String? couponCode;
  final String? couponName;
  final DateTime reservationExpiresAt;

  double get subtotal => subtotalCents / 100;
  double get shipping => shippingCents / 100;
  double get discount => discountCents / 100;
  double get total => totalCents / 100;
}

class CheckoutInput {
  const CheckoutInput({
    required this.sessionId,
    required this.email,
    required this.fullName,
    required this.phone,
    required this.addressLine1,
    required this.city,
    required this.state,
    required this.postcode,
    this.addressLine2,
    this.couponCode,
  });

  final String sessionId;
  final String email;
  final String fullName;
  final String phone;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String postcode;
  final String? couponCode;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'sessionId': sessionId,
      'email': email.trim(),
      'fullName': fullName.trim(),
      'phone': phone.trim(),
      'addressLine1': addressLine1.trim(),
      if (addressLine2?.trim().isNotEmpty ?? false)
        'addressLine2': addressLine2!.trim(),
      'city': city.trim(),
      'state': state.trim(),
      'postcode': postcode.trim(),
      'countryCode': 'MY',
      'shippingMethod': 'STANDARD',
      if (couponCode?.trim().isNotEmpty ?? false)
        'couponCode': couponCode!.trim(),
    };
  }
}

class PaymentSession {
  const PaymentSession({
    required this.id,
    required this.provider,
    required this.status,
    required this.amountCents,
    required this.currency,
    this.checkoutUrl,
  });

  factory PaymentSession.fromJson(Map<String, dynamic> json) {
    return PaymentSession(
      id: json['id'] as String,
      provider: json['provider'] as String,
      status: json['status'] as String,
      amountCents: json['amountCents'] as int,
      currency: json['currency'] as String? ?? 'MYR',
      checkoutUrl: json['checkoutUrl'] as String?,
    );
  }

  final String id;
  final String provider;
  final String status;
  final int amountCents;
  final String currency;
  final String? checkoutUrl;
}

class CouponValidation {
  const CouponValidation({
    required this.code,
    required this.name,
    required this.discountCents,
  });

  factory CouponValidation.fromJson(Map<String, dynamic> json) {
    return CouponValidation(
      code: json['code'] as String,
      name: json['name'] as String,
      discountCents: json['discountCents'] as int,
    );
  }

  final String code;
  final String name;
  final int discountCents;

  double get discount => discountCents / 100;
}

class AutomaticPromotionPreview {
  const AutomaticPromotionPreview(
      {required this.id, required this.name, required this.discountCents});

  factory AutomaticPromotionPreview.fromJson(Map<String, dynamic> json) =>
      AutomaticPromotionPreview(
        id: json['id'] as String,
        name: json['name'] as String,
        discountCents: json['discountCents'] as int,
      );

  final String id;
  final String name;
  final int discountCents;
  double get discount => discountCents / 100;
}
