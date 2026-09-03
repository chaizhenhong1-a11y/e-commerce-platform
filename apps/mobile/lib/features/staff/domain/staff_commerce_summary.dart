class StaffCommerceSummary {
  const StaffCommerceSummary({
    required this.totalOrders,
    required this.awaitingPayment,
    required this.readyToFulfill,
    required this.fulfilled,
    required this.activeReturns,
    required this.refundProcessing,
    required this.lowStockVariants,
  });

  factory StaffCommerceSummary.fromJson(Map<String, dynamic> json) {
    int readCount(String key) {
      final value = json[key];
      return value is num ? value.toInt() : 0;
    }

    return StaffCommerceSummary(
      totalOrders: readCount('totalOrders'),
      awaitingPayment: readCount('awaitingPayment'),
      readyToFulfill: readCount('readyToFulfill'),
      fulfilled: readCount('fulfilled'),
      activeReturns: readCount('activeReturns'),
      refundProcessing: readCount('refundProcessing'),
      lowStockVariants: readCount('lowStockVariants'),
    );
  }

  final int totalOrders;
  final int awaitingPayment;
  final int readyToFulfill;
  final int fulfilled;
  final int activeReturns;
  final int refundProcessing;
  final int lowStockVariants;
}
