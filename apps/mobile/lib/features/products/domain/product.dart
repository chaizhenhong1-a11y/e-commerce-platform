class ProductImage {
  const ProductImage({
    required this.id,
    required this.url,
    required this.altText,
    required this.isPrimary,
    this.variantId,
  });

  factory ProductImage.fromJson(Map<String, dynamic> json) {
    return ProductImage(
      id: json['id'] as String,
      variantId: json['variantId'] as String?,
      url: json['url'] as String,
      altText: json['altText'] as String? ?? '',
      isPrimary: json['isPrimary'] as bool? ?? false,
    );
  }

  final String id;
  final String? variantId;
  final String url;
  final String altText;
  final bool isPrimary;
}

class ProductVariant {
  const ProductVariant({
    required this.id,
    required this.sku,
    required this.name,
    required this.price,
    required this.availableStock,
    required this.optionValues,
    this.compareAtPrice,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    final inventory = json['inventory'] as Map<String, dynamic>?;
    final quantity = inventory?['quantity'] as int? ?? 0;
    final reserved = inventory?['reserved'] as int? ?? 0;
    final availableStock = quantity - reserved;

    final rawOptionValues = json['optionValues'];
    final optionValues = rawOptionValues is Map<String, dynamic>
        ? rawOptionValues.map((key, value) => MapEntry(key, value.toString()))
        : <String, String>{'Option': json['name'] as String? ?? 'Default'};

    return ProductVariant(
      id: json['id'] as String,
      sku: json['sku'] as String? ?? '',
      name: json['name'] as String? ?? 'Default',
      price: (json['priceCents'] as int) / 100,
      compareAtPrice: json['compareAtCents'] is int
          ? (json['compareAtCents'] as int) / 100
          : null,
      availableStock: availableStock < 0 ? 0 : availableStock,
      optionValues: optionValues.isEmpty
          ? <String, String>{'Option': json['name'] as String? ?? 'Default'}
          : optionValues,
    );
  }

  final String id;
  final String sku;
  final String name;
  final double price;
  final double? compareAtPrice;
  final int availableStock;
  final Map<String, String> optionValues;

  bool get inStock => availableStock > 0;
}

class ProductDetails {
  const ProductDetails({
    this.material,
    this.dimensions,
    this.care,
    this.highlights = const <String>[],
    this.specifications = const <String, String>{},
  });

  factory ProductDetails.fromJson(Object? value) {
    if (value is! Map) return const ProductDetails();
    final map = Map<String, dynamic>.from(value);
    String? text(Object? raw) {
      final result = raw?.toString().trim();
      return result == null || result.isEmpty ? null : result;
    }

    final rawHighlights = map['highlights'];
    final rawSpecifications = map['specifications'];
    return ProductDetails(
      material: text(map['material']),
      dimensions: text(map['dimensions']),
      care: text(map['care']),
      highlights: rawHighlights is List
          ? rawHighlights.map(text).whereType<String>().toList(growable: false)
          : const <String>[],
      specifications: rawSpecifications is Map
          ? <String, String>{
              for (final entry in rawSpecifications.entries)
                if (text(entry.key) != null && text(entry.value) != null)
                  text(entry.key)!: text(entry.value)!,
            }
          : const <String, String>{},
    );
  }

  final String? material;
  final String? dimensions;
  final String? care;
  final List<String> highlights;
  final Map<String, String> specifications;

  bool get isEmpty =>
      material == null &&
      dimensions == null &&
      care == null &&
      highlights.isEmpty &&
      specifications.isEmpty;
}

class Product {
  const Product({
    required this.id,
    required this.slug,
    required this.name,
    required this.description,
    required this.category,
    required this.variants,
    required this.images,
    this.details = const ProductDetails(),
    this.colorSwatches = const <String, String>{},
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final category = json['category'] as Map<String, dynamic>?;
    final rawVariants = json['variants'] as List<dynamic>? ?? const <dynamic>[];
    if (rawVariants.isEmpty) {
      throw const FormatException('Product has no active variants.');
    }

    final variants = rawVariants
        .map(
          (item) => ProductVariant.fromJson(item as Map<String, dynamic>),
        )
        .toList(growable: false);

    final rawImages = json['images'] as List<dynamic>? ?? const <dynamic>[];
    final images = rawImages
        .map(
          (item) => ProductImage.fromJson(item as Map<String, dynamic>),
        )
        .toList(growable: false);

    return Product(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      category: category?['name'] as String? ?? 'Shop',
      variants: variants,
      images: images,
      details: ProductDetails.fromJson(json['details']),
      colorSwatches: _stringMap(json['colorSwatches']),
    );
  }

  final String id;
  final String slug;
  final String name;
  final String description;
  final String category;
  final List<ProductVariant> variants;
  final List<ProductImage> images;
  final ProductDetails details;
  final Map<String, String> colorSwatches;

  static Map<String, String> _stringMap(Object? value) {
    if (value is! Map) return const <String, String>{};
    return <String, String>{
      for (final entry in value.entries)
        if (entry.key.toString().trim().isNotEmpty &&
            entry.value.toString().trim().isNotEmpty)
          entry.key.toString().trim(): entry.value.toString().trim(),
    };
  }

  ProductVariant get defaultVariant {
    for (final variant in variants) {
      if (variant.inStock) return variant;
    }
    return variants.first;
  }

  List<ProductImage> imagesForVariant(String variantId) {
    final eligibleImages = images
        .where(
          (image) => image.variantId == null || image.variantId == variantId,
        )
        .toList(growable: false);

    // The API already orders product media with the primary image first.
    // Preserve that authoritative order instead of regrouping variant images
    // ahead of shared images, which could move the selected primary image
    // into a later thumbnail position.
    return eligibleImages.isNotEmpty ? eligibleImages : images;
  }

  String? get imageUrl {
    if (images.isEmpty) return null;
    for (final image in images) {
      if (image.isPrimary) return image.url;
    }
    return images.first.url;
  }

  double get price => defaultVariant.price;
  String get variantId => defaultVariant.id;
  String get variantName => defaultVariant.name;
  int get availableStock => defaultVariant.availableStock;
  bool get inStock => variants.any((variant) => variant.inStock);
  bool get hasMultipleVariants => variants.length > 1;
}
