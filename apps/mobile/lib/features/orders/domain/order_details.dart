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
    required this.totalCents,
    required this.createdAt,
    required this.shipping,
    required this.items,
    this.reservationExpiresAt,
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
      totalCents: json['totalCents'] as int,
      reservationExpiresAt: json['reservationExpiresAt'] == null
          ? null
          : DateTime.parse(json['reservationExpiresAt'] as String).toLocal(),
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      shipping: OrderShippingDetails.fromJson(
        json['shipping'] as Map<String, dynamic>,
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
  final int totalCents;
  final DateTime? reservationExpiresAt;
  final DateTime createdAt;
  final OrderShippingDetails shipping;
  final List<OrderDetailsItem> items;

  double get subtotal => subtotalCents / 100;
  double get shippingTotal => shippingCents / 100;
  double get total => totalCents / 100;
}
