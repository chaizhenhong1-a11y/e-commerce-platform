class CustomerOrderItem {
  const CustomerOrderItem({
    required this.id,
    required this.productName,
    required this.variantName,
    required this.quantity,
  });

  factory CustomerOrderItem.fromJson(Map<String, dynamic> json) {
    return CustomerOrderItem(
      id: json['id'] as String,
      productName: json['productName'] as String,
      variantName: json['variantName'] as String?,
      quantity: json['quantity'] as int,
    );
  }

  final String id;
  final String productName;
  final String? variantName;
  final int quantity;
}

class CustomerOrder {
  const CustomerOrder({
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.currency,
    required this.totalCents,
    required this.createdAt,
    required this.itemCount,
    required this.items,
  });

  factory CustomerOrder.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? const <dynamic>[];
    return CustomerOrder(
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String,
      paymentStatus: json['paymentStatus'] as String,
      currency: json['currency'] as String? ?? 'MYR',
      totalCents: json['totalCents'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      itemCount: json['itemCount'] as int? ?? 0,
      items: rawItems
          .map((item) => CustomerOrderItem.fromJson(
                item as Map<String, dynamic>,
              ))
          .toList(growable: false),
    );
  }

  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String currency;
  final int totalCents;
  final DateTime createdAt;
  final int itemCount;
  final List<CustomerOrderItem> items;

  double get total => totalCents / 100;
}
