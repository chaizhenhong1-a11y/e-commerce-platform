class StaffReturnCase {
  const StaffReturnCase({
    required this.id,
    required this.status,
    required this.reason,
    required this.requestedAt,
    required this.order,
    required this.items,
    this.customerNote,
    this.staffNote,
    this.approvedAt,
    this.receivedAt,
    this.completedAt,
    this.refund,
  });

  factory StaffReturnCase.fromJson(Map<String, dynamic> json) {
    final orderJson = json['order'];
    final rawItems = json['items'];
    final refundJson = json['refund'];

    return StaffReturnCase(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'UNKNOWN',
      reason: json['reason']?.toString() ?? '',
      customerNote: _text(json['customerNote']),
      staffNote: _text(json['staffNote']),
      requestedAt: _date(json['requestedAt']),
      approvedAt: _date(json['approvedAt']),
      receivedAt: _date(json['receivedAt']),
      completedAt: _date(json['completedAt']),
      order: orderJson is Map<String, dynamic>
          ? StaffReturnOrder.fromJson(orderJson)
          : const StaffReturnOrder.empty(),
      items: rawItems is List
          ? rawItems
              .whereType<Map<String, dynamic>>()
              .map(StaffReturnItem.fromJson)
              .toList(growable: false)
          : const <StaffReturnItem>[],
      refund: refundJson is Map<String, dynamic>
          ? StaffReturnRefund.fromJson(refundJson)
          : null,
    );
  }

  final String id;
  final String status;
  final String reason;
  final String? customerNote;
  final String? staffNote;
  final DateTime? requestedAt;
  final DateTime? approvedAt;
  final DateTime? receivedAt;
  final DateTime? completedAt;
  final StaffReturnOrder order;
  final List<StaffReturnItem> items;
  final StaffReturnRefund? refund;

  static String? _text(Object? value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }

  static DateTime? _date(Object? value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : DateTime.tryParse(text);
  }
}

class StaffReturnOrder {
  const StaffReturnOrder({
    required this.orderNumber,
    required this.email,
    required this.currency,
    required this.totalCents,
    required this.paymentStatus,
    this.createdAt,
  });

  const StaffReturnOrder.empty()
      : orderNumber = '',
        email = '',
        currency = 'MYR',
        totalCents = 0,
        paymentStatus = 'UNKNOWN',
        createdAt = null;

  factory StaffReturnOrder.fromJson(Map<String, dynamic> json) {
    return StaffReturnOrder(
      orderNumber: json['orderNumber']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      currency: json['currency']?.toString() ?? 'MYR',
      totalCents: (json['totalCents'] as num?)?.toInt() ?? 0,
      paymentStatus: json['paymentStatus']?.toString() ?? 'UNKNOWN',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }

  final String orderNumber;
  final String email;
  final String currency;
  final int totalCents;
  final String paymentStatus;
  final DateTime? createdAt;
}

class StaffReturnItem {
  const StaffReturnItem({
    required this.id,
    required this.quantity,
    required this.orderItem,
    this.condition,
    this.disposition,
    this.inspectedAt,
    this.restockedAt,
  });

  factory StaffReturnItem.fromJson(Map<String, dynamic> json) {
    final orderItemJson = json['orderItem'];
    return StaffReturnItem(
      id: json['id']?.toString() ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      condition: StaffReturnCase._text(json['condition']),
      disposition: StaffReturnCase._text(json['disposition']),
      inspectedAt: StaffReturnCase._date(json['inspectedAt']),
      restockedAt: StaffReturnCase._date(json['restockedAt']),
      orderItem: orderItemJson is Map<String, dynamic>
          ? StaffReturnOrderItem.fromJson(orderItemJson)
          : const StaffReturnOrderItem.empty(),
    );
  }

  final String id;
  final int quantity;
  final String? condition;
  final String? disposition;
  final DateTime? inspectedAt;
  final DateTime? restockedAt;
  final StaffReturnOrderItem orderItem;
}

class StaffReturnOrderItem {
  const StaffReturnOrderItem({
    required this.id,
    required this.sku,
    required this.productName,
    required this.variantName,
    required this.quantity,
    required this.unitPriceCents,
  });

  const StaffReturnOrderItem.empty()
      : id = '',
        sku = '',
        productName = '',
        variantName = '',
        quantity = 0,
        unitPriceCents = 0;

  factory StaffReturnOrderItem.fromJson(Map<String, dynamic> json) {
    return StaffReturnOrderItem(
      id: json['id']?.toString() ?? '',
      sku: json['sku']?.toString() ?? '',
      productName: json['productName']?.toString() ?? '',
      variantName: json['variantName']?.toString() ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      unitPriceCents: (json['unitPriceCents'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final String sku;
  final String productName;
  final String variantName;
  final int quantity;
  final int unitPriceCents;
}

class StaffReturnRefund {
  const StaffReturnRefund({
    required this.id,
    required this.status,
    required this.amountCents,
    required this.currency,
  });

  factory StaffReturnRefund.fromJson(Map<String, dynamic> json) {
    return StaffReturnRefund(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'UNKNOWN',
      amountCents: (json['amountCents'] as num?)?.toInt() ?? 0,
      currency: json['currency']?.toString() ?? 'MYR',
    );
  }

  final String id;
  final String status;
  final int amountCents;
  final String currency;
}

class StaffReturnInspection {
  const StaffReturnInspection({
    required this.returnItemId,
    required this.condition,
    required this.disposition,
  });

  final String returnItemId;
  final String condition;
  final String disposition;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'returnItemId': returnItemId,
      'condition': condition,
      'disposition': disposition,
    };
  }
}
