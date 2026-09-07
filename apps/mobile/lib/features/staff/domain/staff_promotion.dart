enum StaffPromotionDiscountType {
  percentage,
  fixedAmount;

  String get apiValue => this == StaffPromotionDiscountType.percentage
      ? 'PERCENTAGE'
      : 'FIXED_AMOUNT';

  String get label => this == StaffPromotionDiscountType.percentage
      ? 'Percentage'
      : 'Fixed amount';

  static StaffPromotionDiscountType fromJson(Object? value) {
    return value?.toString() == 'FIXED_AMOUNT'
        ? StaffPromotionDiscountType.fixedAmount
        : StaffPromotionDiscountType.percentage;
  }
}

class StaffCouponPromotion {
  const StaffCouponPromotion({
    required this.id,
    required this.code,
    required this.name,
    required this.discountType,
    required this.value,
    required this.minSubtotalCents,
    required this.isActive,
    required this.productIds,
    required this.categoryIds,
    required this.redemptionCount,
    this.description,
    this.maxDiscountCents,
    this.startsAt,
    this.endsAt,
    this.usageLimit,
    this.perUserLimit,
  });

  factory StaffCouponPromotion.fromJson(Map<String, dynamic> json) {
    return StaffCouponPromotion(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: _nullableText(json['description']),
      discountType: StaffPromotionDiscountType.fromJson(json['discountType']),
      value: (json['value'] as num?)?.toInt() ?? 0,
      minSubtotalCents: (json['minSubtotalCents'] as num?)?.toInt() ?? 0,
      maxDiscountCents: (json['maxDiscountCents'] as num?)?.toInt(),
      startsAt: _date(json['startsAt']),
      endsAt: _date(json['endsAt']),
      usageLimit: (json['usageLimit'] as num?)?.toInt(),
      perUserLimit: (json['perUserLimit'] as num?)?.toInt(),
      isActive: json['isActive'] == true,
      productIds: _stringList(json['productIds']),
      categoryIds: _stringList(json['categoryIds']),
      redemptionCount: _nestedCount(json['_count'], 'redemptions'),
    );
  }

  final String id;
  final String code;
  final String name;
  final String? description;
  final StaffPromotionDiscountType discountType;
  final int value;
  final int minSubtotalCents;
  final int? maxDiscountCents;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final int? usageLimit;
  final int? perUserLimit;
  final bool isActive;
  final List<String> productIds;
  final List<String> categoryIds;
  final int redemptionCount;
}

class StaffAutomaticPromotion {
  const StaffAutomaticPromotion({
    required this.id,
    required this.name,
    required this.discountType,
    required this.value,
    required this.minSubtotalCents,
    required this.priority,
    required this.isActive,
    required this.productIds,
    required this.categoryIds,
    this.description,
    this.maxDiscountCents,
    this.startsAt,
    this.endsAt,
  });

  factory StaffAutomaticPromotion.fromJson(Map<String, dynamic> json) {
    return StaffAutomaticPromotion(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: _nullableText(json['description']),
      discountType: StaffPromotionDiscountType.fromJson(json['discountType']),
      value: (json['value'] as num?)?.toInt() ?? 0,
      minSubtotalCents: (json['minSubtotalCents'] as num?)?.toInt() ?? 0,
      maxDiscountCents: (json['maxDiscountCents'] as num?)?.toInt(),
      startsAt: _date(json['startsAt']),
      endsAt: _date(json['endsAt']),
      priority: (json['priority'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] == true,
      productIds: _stringList(json['productIds']),
      categoryIds: _stringList(json['categoryIds']),
    );
  }

  final String id;
  final String name;
  final String? description;
  final StaffPromotionDiscountType discountType;
  final int value;
  final int minSubtotalCents;
  final int? maxDiscountCents;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final int priority;
  final bool isActive;
  final List<String> productIds;
  final List<String> categoryIds;
}

class StaffPromotionCatalogOption {
  const StaffPromotionCatalogOption({required this.id, required this.name});

  final String id;
  final String name;
}

class StaffPromotionEditorOptions {
  const StaffPromotionEditorOptions({
    required this.products,
    required this.categories,
  });

  final List<StaffPromotionCatalogOption> products;
  final List<StaffPromotionCatalogOption> categories;
}

String? _nullableText(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

DateTime? _date(Object? value) {
  final text = _nullableText(value);
  return text == null ? null : DateTime.tryParse(text)?.toLocal();
}

List<String> _stringList(Object? value) {
  if (value is! List) return const <String>[];
  return value
      .map((item) => item.toString())
      .where((item) => item.isNotEmpty)
      .toList(growable: false);
}

int _nestedCount(Object? value, String key) {
  if (value is Map<String, dynamic>) {
    return (value[key] as num?)?.toInt() ?? 0;
  }
  return 0;
}
