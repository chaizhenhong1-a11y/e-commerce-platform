class StaffCatalogProduct {
  const StaffCatalogProduct({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.isFeatured,
    required this.variants,
    this.images = const <StaffProductImage>[],
    this.description,
    this.categoryId,
    this.categoryName,
    this.updatedAt,
  });

  factory StaffCatalogProduct.fromJson(Map<String, dynamic> json) {
    final category = json['category'];
    final variants = json['variants'];
    return StaffCatalogProduct(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      status: json['status']?.toString() ?? 'UNKNOWN',
      isFeatured: json['isFeatured'] == true,
      description: _text(json['description']),
      categoryId: _text(json['categoryId']) ??
          (category is Map<String, dynamic> ? _text(category['id']) : null),
      categoryName:
          category is Map<String, dynamic> ? _text(category['name']) : null,
      variants: variants is List
          ? variants
              .whereType<Map<String, dynamic>>()
              .map(StaffCatalogVariant.fromJson)
              .toList(growable: false)
          : const <StaffCatalogVariant>[],
      images: json['images'] is List
          ? (json['images'] as List)
              .whereType<Map<String, dynamic>>()
              .map(StaffProductImage.fromJson)
              .toList(growable: false)
          : const <StaffProductImage>[],
      updatedAt: _date(json['updatedAt']),
    );
  }

  final String id;
  final String name;
  final String slug;
  final String status;
  final bool isFeatured;
  final String? description;
  final String? categoryId;
  final String? categoryName;
  final List<StaffCatalogVariant> variants;
  final List<StaffProductImage> images;
  final DateTime? updatedAt;

  int get totalQuantity => variants.fold(
        0,
        (total, variant) => total + (variant.inventory?.quantity ?? 0),
      );

  int get totalReserved => variants.fold(
        0,
        (total, variant) => total + (variant.inventory?.reserved ?? 0),
      );

  int get availableStock => totalQuantity - totalReserved;

  static String? _text(Object? value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }

  static DateTime? _date(Object? value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : DateTime.tryParse(text);
  }
}

class StaffCatalogVariant {
  const StaffCatalogVariant({
    required this.id,
    required this.sku,
    required this.name,
    required this.priceCents,
    required this.currency,
    required this.isActive,
    this.compareAtCents,
    this.optionValues = const <String, String>{},
    this.inventory,
  });

  factory StaffCatalogVariant.fromJson(Map<String, dynamic> json) {
    final inventory = json['inventory'];
    return StaffCatalogVariant(
      id: json['id']?.toString() ?? '',
      sku: json['sku']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      priceCents: (json['priceCents'] as num?)?.toInt() ?? 0,
      compareAtCents: (json['compareAtCents'] as num?)?.toInt(),
      currency: json['currency']?.toString() ?? 'MYR',
      isActive: json['isActive'] == true,
      optionValues: _optionValues(json['optionValues']),
      inventory: inventory is Map<String, dynamic>
          ? StaffCatalogInventory.fromJson(inventory)
          : null,
    );
  }

  final String id;
  final String sku;
  final String name;
  final int priceCents;
  final int? compareAtCents;
  final String currency;
  final bool isActive;
  final Map<String, String> optionValues;
  final StaffCatalogInventory? inventory;

  static Map<String, String> _optionValues(Object? value) {
    if (value is! Map) {
      return const <String, String>{};
    }
    return <String, String>{
      for (final entry in value.entries)
        if (entry.key.toString().trim().isNotEmpty &&
            entry.value.toString().trim().isNotEmpty)
          entry.key.toString().trim(): entry.value.toString().trim(),
    };
  }

  int get quantity => inventory?.quantity ?? 0;
  int get reserved => inventory?.reserved ?? 0;
  int get available => quantity - reserved;
}

class StaffCatalogInventory {
  const StaffCatalogInventory({
    required this.id,
    required this.quantity,
    required this.reserved,
  });

  factory StaffCatalogInventory.fromJson(Map<String, dynamic> json) {
    return StaffCatalogInventory(
      id: json['id']?.toString() ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      reserved: (json['reserved'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final int quantity;
  final int reserved;
}

class StaffInventoryAdjustment {
  const StaffInventoryAdjustment({
    required this.id,
    required this.delta,
    required this.previousQuantity,
    required this.newQuantity,
    required this.reason,
    required this.actor,
    this.createdAt,
  });

  factory StaffInventoryAdjustment.fromJson(Map<String, dynamic> json) {
    final actor = json['actor'];
    return StaffInventoryAdjustment(
      id: json['id']?.toString() ?? '',
      delta: (json['delta'] as num?)?.toInt() ?? 0,
      previousQuantity: (json['previousQuantity'] as num?)?.toInt() ?? 0,
      newQuantity: (json['newQuantity'] as num?)?.toInt() ?? 0,
      reason: json['reason']?.toString() ?? '',
      createdAt: StaffCatalogProduct._date(json['createdAt']),
      actor: actor is Map<String, dynamic>
          ? StaffInventoryActor.fromJson(actor)
          : const StaffInventoryActor.empty(),
    );
  }

  final String id;
  final int delta;
  final int previousQuantity;
  final int newQuantity;
  final String reason;
  final DateTime? createdAt;
  final StaffInventoryActor actor;
}

class StaffInventoryActor {
  const StaffInventoryActor({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
  });

  const StaffInventoryActor.empty()
      : id = '',
        email = '',
        firstName = '',
        lastName = '';

  factory StaffInventoryActor.fromJson(Map<String, dynamic> json) {
    return StaffInventoryActor(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? '',
      lastName: json['lastName']?.toString() ?? '',
    );
  }

  final String id;
  final String email;
  final String firstName;
  final String lastName;

  String get displayName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? email : name;
  }
}

class StaffInventoryAdjustmentResult {
  const StaffInventoryAdjustmentResult({
    required this.inventory,
    required this.adjustment,
  });

  factory StaffInventoryAdjustmentResult.fromJson(Map<String, dynamic> json) {
    final inventory = json['inventory'];
    final adjustment = json['adjustment'];
    return StaffInventoryAdjustmentResult(
      inventory: inventory is Map<String, dynamic>
          ? StaffCatalogInventory.fromJson(inventory)
          : const StaffCatalogInventory(id: '', quantity: 0, reserved: 0),
      adjustment: adjustment is Map<String, dynamic>
          ? StaffInventoryAdjustment.fromJson(adjustment)
          : StaffInventoryAdjustment(
              id: '',
              delta: 0,
              previousQuantity: 0,
              newQuantity: 0,
              reason: '',
              actor: const StaffInventoryActor.empty(),
            ),
    );
  }

  final StaffCatalogInventory inventory;
  final StaffInventoryAdjustment adjustment;
}

class StaffProductEditorOptions {
  const StaffProductEditorOptions({required this.categories});

  factory StaffProductEditorOptions.fromJson(Map<String, dynamic> json) {
    final raw = json['categories'];
    return StaffProductEditorOptions(
      categories: raw is List
          ? raw
              .whereType<Map<String, dynamic>>()
              .map(StaffEditorCategory.fromJson)
              .toList(growable: false)
          : const <StaffEditorCategory>[],
    );
  }

  final List<StaffEditorCategory> categories;
}

class StaffEditorCategory {
  const StaffEditorCategory({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory StaffEditorCategory.fromJson(Map<String, dynamic> json) {
    return StaffEditorCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
    );
  }

  final String id;
  final String name;
  final String slug;
}

class StaffVariantRemovalResult {
  const StaffVariantRemovalResult({
    required this.deleted,
    required this.deactivated,
    this.message,
  });

  factory StaffVariantRemovalResult.fromJson(Map<String, dynamic> json) {
    final rawMessage = json['message']?.toString().trim();
    return StaffVariantRemovalResult(
      deleted: json['deleted'] == true,
      deactivated: json['deactivated'] == true,
      message: rawMessage == null || rawMessage.isEmpty ? null : rawMessage,
    );
  }

  final bool deleted;
  final bool deactivated;
  final String? message;
}

class StaffVariantMatrixOption {
  const StaffVariantMatrixOption({
    required this.name,
    required this.values,
  });

  final String name;
  final List<String> values;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'name': name.trim(),
        'values': values.map((value) => value.trim()).toList(growable: false),
      };
}

class StaffVariantMatrixResult {
  const StaffVariantMatrixResult({
    required this.createdCount,
    required this.skippedCount,
  });

  factory StaffVariantMatrixResult.fromJson(Map<String, dynamic> json) {
    return StaffVariantMatrixResult(
      createdCount: (json['createdCount'] as num?)?.toInt() ?? 0,
      skippedCount: (json['skippedCount'] as num?)?.toInt() ?? 0,
    );
  }

  final int createdCount;
  final int skippedCount;
}

class StaffProductImage {
  const StaffProductImage({
    required this.id,
    required this.url,
    required this.sortOrder,
    required this.isPrimary,
    this.altText,
    this.variantId,
  });

  factory StaffProductImage.fromJson(Map<String, dynamic> json) {
    final alt = json['altText']?.toString().trim();
    final variant = json['variantId']?.toString().trim();
    return StaffProductImage(
      id: json['id']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      altText: alt == null || alt.isEmpty ? null : alt,
      variantId: variant == null || variant.isEmpty ? null : variant,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      isPrimary: json['isPrimary'] == true,
    );
  }

  final String id;
  final String url;
  final String? altText;
  final String? variantId;
  final int sortOrder;
  final bool isPrimary;
}
