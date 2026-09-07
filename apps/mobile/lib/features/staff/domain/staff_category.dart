class StaffCategory {
  const StaffCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.isActive,
    required this.sortOrder,
    required this.productCount,
  });

  factory StaffCategory.fromJson(Map<String, dynamic> json) {
    final count = json['_count'];
    final products = count is Map<String, dynamic> ? count['products'] : null;
    return StaffCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      isActive: json['isActive'] == true,
      sortOrder: _readInt(json['sortOrder']),
      productCount: _readInt(json['productCount'] ?? products),
    );
  }

  final String id;
  final String name;
  final String slug;
  final bool isActive;
  final int sortOrder;
  final int productCount;

  static int _readInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
