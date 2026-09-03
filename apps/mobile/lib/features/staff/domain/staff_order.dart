class StaffOrder {
  const StaffOrder({
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.email,
    required this.customerName,
    required this.currency,
    required this.totalCents,
    required this.createdAt,
    required this.itemCount,
    required this.items,
    required this.canProcess,
    required this.canShip,
    required this.canDeliver,
    this.courierName,
    this.trackingNumber,
    this.trackingUrl,
    this.processingAt,
    this.shippedAt,
    this.deliveredAt,
  });

  factory StaffOrder.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    return StaffOrder(
      orderNumber: json['orderNumber']?.toString() ?? '',
      status: json['status']?.toString() ?? 'UNKNOWN',
      paymentStatus: json['paymentStatus']?.toString() ?? 'UNKNOWN',
      email: json['email']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? '',
      currency: json['currency']?.toString() ?? 'MYR',
      totalCents: (json['totalCents'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
      items: rawItems is List
          ? rawItems
              .whereType<Map<String, dynamic>>()
              .map(StaffOrderItem.fromJson)
              .toList(growable: false)
          : const <StaffOrderItem>[],
      canProcess: json['canProcess'] == true,
      canShip: json['canShip'] == true,
      canDeliver: json['canDeliver'] == true,
      courierName: _text(json['courierName']),
      trackingNumber: _text(json['trackingNumber']),
      trackingUrl: _text(json['trackingUrl']),
      processingAt: _date(json['processingAt']),
      shippedAt: _date(json['shippedAt']),
      deliveredAt: _date(json['deliveredAt']),
    );
  }

  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String email;
  final String customerName;
  final String currency;
  final int totalCents;
  final DateTime? createdAt;
  final int itemCount;
  final List<StaffOrderItem> items;
  final bool canProcess;
  final bool canShip;
  final bool canDeliver;
  final String? courierName;
  final String? trackingNumber;
  final String? trackingUrl;
  final DateTime? processingAt;
  final DateTime? shippedAt;
  final DateTime? deliveredAt;

  static String? _text(Object? value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }

  static DateTime? _date(Object? value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : DateTime.tryParse(text);
  }
}

class StaffOrderItem {
  const StaffOrderItem({
    required this.id,
    required this.sku,
    required this.productName,
    required this.variantName,
    required this.quantity,
  });

  factory StaffOrderItem.fromJson(Map<String, dynamic> json) {
    return StaffOrderItem(
      id: json['id']?.toString() ?? '',
      sku: json['sku']?.toString() ?? '',
      productName: json['productName']?.toString() ?? '',
      variantName: json['variantName']?.toString() ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final String sku;
  final String productName;
  final String variantName;
  final int quantity;
}
