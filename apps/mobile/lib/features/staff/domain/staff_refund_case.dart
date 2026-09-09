class StaffRefundCase {
  const StaffRefundCase({
    required this.id, required this.orderNumber, required this.customerName,
    required this.email, required this.reason, required this.customerNote,
    required this.amountCents, required this.orderTotalCents, required this.currency,
    required this.status, required this.provider, required this.requestedAt,
    required this.processedAt, required this.failureMessage,
  });

  factory StaffRefundCase.fromJson(Map<String, dynamic> json) => StaffRefundCase(
    id: json['id'] as String, orderNumber: json['orderNumber'] as String,
    customerName: json['customerName'] as String? ?? '', email: json['email'] as String? ?? '',
    reason: json['reason'] as String? ?? '', customerNote: json['customerNote'] as String?,
    amountCents: json['amountCents'] as int? ?? 0, orderTotalCents: json['orderTotalCents'] as int? ?? 0,
    currency: json['currency'] as String? ?? 'MYR', status: json['status'] as String? ?? 'REQUESTED',
    provider: json['provider'] as String? ?? '',
    requestedAt: DateTime.tryParse(json['requestedAt'] as String? ?? ''),
    processedAt: DateTime.tryParse(json['processedAt'] as String? ?? ''),
    failureMessage: json['failureMessage'] as String?,
  );

  final String id, orderNumber, customerName, email, reason, currency, status, provider;
  final String? customerNote, failureMessage;
  final int amountCents, orderTotalCents;
  final DateTime? requestedAt, processedAt;
}
