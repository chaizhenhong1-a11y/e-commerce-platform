class StaffCommerceSummary {
  const StaffCommerceSummary({
    required this.currency,
    required this.timeZone,
    required this.totalOrders,
    required this.awaitingPayment,
    required this.readyToFulfill,
    required this.fulfilled,
    required this.activeReturns,
    required this.refundProcessing,
    required this.lowStockVariants,
    required this.todayOrders,
    required this.todayGrossSalesCents,
    required this.todayRefundsCents,
    required this.todayNetSalesCents,
    required this.monthOrders,
    required this.monthGrossSalesCents,
    required this.monthRefundsCents,
    required this.monthNetSalesCents,
    required this.averageOrderValueCents,
  });

  factory StaffCommerceSummary.fromJson(Map<String, dynamic> json) {
    int readCount(String key) {
      final value = json[key];
      return value is num ? value.toInt() : 0;
    }

    String readText(String key, String fallback) {
      final value = json[key];
      return value is String && value.trim().isNotEmpty ? value : fallback;
    }

    return StaffCommerceSummary(
      currency: readText('currency', 'MYR'),
      timeZone: readText('timeZone', 'Asia/Kuala_Lumpur'),
      totalOrders: readCount('totalOrders'),
      awaitingPayment: readCount('awaitingPayment'),
      readyToFulfill: readCount('readyToFulfill'),
      fulfilled: readCount('fulfilled'),
      activeReturns: readCount('activeReturns'),
      refundProcessing: readCount('refundProcessing'),
      lowStockVariants: readCount('lowStockVariants'),
      todayOrders: readCount('todayOrders'),
      todayGrossSalesCents: readCount('todayGrossSalesCents'),
      todayRefundsCents: readCount('todayRefundsCents'),
      todayNetSalesCents: readCount('todayNetSalesCents'),
      monthOrders: readCount('monthOrders'),
      monthGrossSalesCents: readCount('monthGrossSalesCents'),
      monthRefundsCents: readCount('monthRefundsCents'),
      monthNetSalesCents: readCount('monthNetSalesCents'),
      averageOrderValueCents: readCount('averageOrderValueCents'),
    );
  }

  final String currency;
  final String timeZone;
  final int totalOrders;
  final int awaitingPayment;
  final int readyToFulfill;
  final int fulfilled;
  final int activeReturns;
  final int refundProcessing;
  final int lowStockVariants;
  final int todayOrders;
  final int todayGrossSalesCents;
  final int todayRefundsCents;
  final int todayNetSalesCents;
  final int monthOrders;
  final int monthGrossSalesCents;
  final int monthRefundsCents;
  final int monthNetSalesCents;
  final int averageOrderValueCents;
}
