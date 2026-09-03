class OrderReturnItemSummary {
  const OrderReturnItemSummary({
    required this.id,
    required this.orderItemId,
    required this.quantity,
    required this.productName,
    required this.variantName,
    required this.sku,
  });

  factory OrderReturnItemSummary.fromJson(Map<String, dynamic> json) {
    return OrderReturnItemSummary(
      id: json['id'] as String,
      orderItemId: json['orderItemId'] as String,
      quantity: json['quantity'] as int,
      productName: json['productName'] as String,
      variantName: json['variantName'] as String? ?? 'Default',
      sku: json['sku'] as String? ?? '',
    );
  }

  final String id;
  final String orderItemId;
  final int quantity;
  final String productName;
  final String variantName;
  final String sku;
}

class OrderReturnSummary {
  const OrderReturnSummary({
    required this.id,
    required this.status,
    required this.reason,
    required this.items,
  });

  factory OrderReturnSummary.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? const <dynamic>[];
    return OrderReturnSummary(
      id: json['id'] as String,
      status: json['status'] as String,
      reason: json['reason'] as String,
      items: rawItems
          .map((item) =>
              OrderReturnItemSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  final String id;
  final String status;
  final String reason;
  final List<OrderReturnItemSummary> items;
}

class OrderRefundSummary {
  const OrderRefundSummary({
    required this.id,
    required this.status,
    required this.reason,
    required this.amountCents,
  });

  factory OrderRefundSummary.fromJson(Map<String, dynamic> json) {
    return OrderRefundSummary(
      id: json['id'] as String,
      status: json['status'] as String,
      reason: json['reason'] as String,
      amountCents: json['amountCents'] as int,
    );
  }

  final String id;
  final String status;
  final String reason;
  final int amountCents;
}

class OrderPaymentSummary {
  const OrderPaymentSummary({
    required this.id,
    required this.provider,
    required this.status,
  });

  factory OrderPaymentSummary.fromJson(Map<String, dynamic> json) {
    return OrderPaymentSummary(
      id: json['id'] as String,
      provider: json['provider'] as String,
      status: json['status'] as String,
    );
  }

  final String id;
  final String provider;
  final String status;
}

class OrderDetailsItem {
  const OrderDetailsItem({
    required this.id,
    required this.sku,
    required this.productName,
    required this.variantName,
    required this.quantity,
    required this.unitPriceCents,
    required this.lineTotalCents,
  });

  factory OrderDetailsItem.fromJson(Map<String, dynamic> json) {
    return OrderDetailsItem(
      id: json['id'] as String,
      sku: json['sku'] as String? ?? '',
      productName: json['productName'] as String,
      variantName: json['variantName'] as String? ?? 'Default',
      quantity: json['quantity'] as int,
      unitPriceCents: json['unitPriceCents'] as int,
      lineTotalCents: json['lineTotalCents'] as int,
    );
  }

  final String id;
  final String sku;
  final String productName;
  final String variantName;
  final int quantity;
  final int unitPriceCents;
  final int lineTotalCents;
}

class OrderShippingDetails {
  const OrderShippingDetails({
    required this.fullName,
    required this.phone,
    required this.line1,
    required this.city,
    required this.state,
    required this.postcode,
    required this.countryCode,
    this.line2,
  });

  factory OrderShippingDetails.fromJson(Map<String, dynamic> json) {
    return OrderShippingDetails(
      fullName: json['fullName'] as String,
      phone: json['phone'] as String,
      line1: json['line1'] as String,
      line2: json['line2'] as String?,
      city: json['city'] as String,
      state: json['state'] as String,
      postcode: json['postcode'] as String,
      countryCode: json['countryCode'] as String,
    );
  }

  final String fullName;
  final String phone;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String postcode;
  final String countryCode;
}

class OrderFulfillmentDetails {
  const OrderFulfillmentDetails({
    this.courierName,
    this.trackingNumber,
    this.trackingUrl,
    this.processingAt,
    this.shippedAt,
    this.deliveredAt,
  });

  factory OrderFulfillmentDetails.fromJson(Map<String, dynamic> json) {
    String? readOptionalString(String key) {
      final value = json[key];
      if (value is! String) {
        return null;
      }

      final trimmed = value.trim();
      return trimmed.isEmpty ? null : trimmed;
    }

    DateTime? parseDate(String key) {
      final value = json[key];
      if (value is! String || value.trim().isEmpty) {
        return null;
      }

      return DateTime.tryParse(value)?.toLocal();
    }

    return OrderFulfillmentDetails(
      courierName: readOptionalString('courierName'),
      trackingNumber: readOptionalString('trackingNumber'),
      trackingUrl: readOptionalString('trackingUrl'),
      processingAt: parseDate('processingAt'),
      shippedAt: parseDate('shippedAt'),
      deliveredAt: parseDate('deliveredAt'),
    );
  }

  final String? courierName;
  final String? trackingNumber;
  final String? trackingUrl;
  final DateTime? processingAt;
  final DateTime? shippedAt;
  final DateTime? deliveredAt;
}

class OrderDetails {
  const OrderDetails({
    required this.orderNumber,
    required this.email,
    required this.status,
    required this.paymentStatus,
    required this.currency,
    required this.shippingMethod,
    required this.subtotalCents,
    required this.shippingCents,
    required this.discountCents,
    required this.totalCents,
    this.couponCode,
    this.couponName,
    required this.createdAt,
    required this.shipping,
    required this.fulfillment,
    required this.items,
    this.reservationExpiresAt,
    this.payment,
    this.refund,
    this.returnRequest,
  });

  factory OrderDetails.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? const <dynamic>[];
    return OrderDetails(
      orderNumber: json['orderNumber'] as String,
      email: json['email'] as String,
      status: json['status'] as String,
      paymentStatus: json['paymentStatus'] as String,
      currency: json['currency'] as String? ?? 'MYR',
      shippingMethod: json['shippingMethod'] as String? ?? 'STANDARD',
      subtotalCents: json['subtotalCents'] as int,
      shippingCents: json['shippingCents'] as int,
      discountCents: json['discountCents'] as int? ?? 0,
      totalCents: json['totalCents'] as int,
      couponCode: json['couponCode'] as String?,
      couponName: json['couponName'] as String?,
      reservationExpiresAt: json['reservationExpiresAt'] == null
          ? null
          : DateTime.parse(json['reservationExpiresAt'] as String).toLocal(),
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      shipping: OrderShippingDetails.fromJson(
        json['shipping'] as Map<String, dynamic>,
      ),
      fulfillment: OrderFulfillmentDetails.fromJson(
        json['fulfillment'] as Map<String, dynamic>? ??
            const <String, dynamic>{},
      ),
      payment: json['payment'] == null
          ? null
          : OrderPaymentSummary.fromJson(
              json['payment'] as Map<String, dynamic>,
            ),
      refund: json['refund'] == null
          ? null
          : OrderRefundSummary.fromJson(
              json['refund'] as Map<String, dynamic>,
            ),
      returnRequest: json['returnRequest'] == null
          ? null
          : OrderReturnSummary.fromJson(
              json['returnRequest'] as Map<String, dynamic>,
            ),
      items: rawItems
          .map(
            (item) => OrderDetailsItem.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .toList(growable: false),
    );
  }

  final String orderNumber;
  final String email;
  final String status;
  final String paymentStatus;
  final String currency;
  final String shippingMethod;
  final int subtotalCents;
  final int shippingCents;
  final int discountCents;
  final int totalCents;
  final String? couponCode;
  final String? couponName;
  final DateTime? reservationExpiresAt;
  final DateTime createdAt;
  final OrderShippingDetails shipping;
  final OrderFulfillmentDetails fulfillment;
  final List<OrderDetailsItem> items;
  final OrderPaymentSummary? payment;
  final OrderRefundSummary? refund;
  final OrderReturnSummary? returnRequest;

  double get subtotal => subtotalCents / 100;
  double get shippingTotal => shippingCents / 100;
  double get total => totalCents / 100;
}
