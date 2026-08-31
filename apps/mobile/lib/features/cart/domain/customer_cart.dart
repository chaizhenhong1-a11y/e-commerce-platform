class CustomerCartItem {
  const CustomerCartItem({
    required this.id,
    required this.variantId,
    required this.sku,
    required this.productName,
    required this.variantName,
    required this.slug,
    required this.quantity,
    required this.priceCents,
    required this.currency,
    required this.availableStock,
    required this.productActive,
    required this.variantActive,
    this.imageUrl,
  });

  factory CustomerCartItem.fromJson(Map<String, dynamic> json) {
    final variant = json['variant'] as Map<String, dynamic>;
    final product = variant['product'] as Map<String, dynamic>;
    final inventory = variant['inventory'] as Map<String, dynamic>?;
    final images = product['images'] as List<dynamic>? ?? const <dynamic>[];
    final variantId = variant['id'] as String;

    String? imageUrl;
    for (final raw in images) {
      final image = raw as Map<String, dynamic>;
      if (image['variantId'] == variantId) {
        imageUrl = image['url'] as String?;
        break;
      }
    }
    if (imageUrl == null) {
      for (final raw in images) {
        final image = raw as Map<String, dynamic>;
        if (image['variantId'] == null && image['isPrimary'] == true) {
          imageUrl = image['url'] as String?;
          break;
        }
      }
    }
    if (imageUrl == null && images.isNotEmpty) {
      imageUrl = (images.first as Map<String, dynamic>)['url'] as String?;
    }

    final available = (inventory?['quantity'] as int? ?? 0) -
        (inventory?['reserved'] as int? ?? 0);

    return CustomerCartItem(
      id: json['id'] as String,
      variantId: variantId,
      sku: variant['sku'] as String? ?? '',
      productName: product['name'] as String,
      variantName: variant['name'] as String,
      slug: product['slug'] as String,
      imageUrl: imageUrl,
      quantity: json['quantity'] as int,
      priceCents: variant['priceCents'] as int,
      currency: variant['currency'] as String? ?? 'MYR',
      availableStock: available < 0 ? 0 : available,
      productActive: product['status'] == 'ACTIVE',
      variantActive: variant['isActive'] as bool? ?? false,
    );
  }

  final String id;
  final String variantId;
  final String sku;
  final String productName;
  final String variantName;
  final String slug;
  final String? imageUrl;
  final int quantity;
  final int priceCents;
  final String currency;
  final int availableStock;
  final bool productActive;
  final bool variantActive;

  double get price => priceCents / 100;
  double get lineTotal => price * quantity;

  String? get issue {
    if (!productActive || !variantActive) return 'No longer available';
    if (availableStock <= 0) return 'Out of stock';
    if (quantity > availableStock) return 'Only $availableStock left';
    return null;
  }
}

class CustomerCart {
  const CustomerCart({
    required this.id,
    required this.sessionId,
    required this.items,
  });

  factory CustomerCart.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? const <dynamic>[];
    return CustomerCart(
      id: json['id'] as String,
      sessionId: json['sessionId'] as String,
      items: rawItems
          .map(
            (item) => CustomerCartItem.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .toList(growable: false),
    );
  }

  final String id;
  final String sessionId;
  final List<CustomerCartItem> items;

  int get totalQuantity =>
      items.fold(0, (total, item) => total + item.quantity);

  double get subtotal => items.fold(
        0,
        (total, item) => total + item.lineTotal,
      );

  int get issueCount => items.where((item) => item.issue != null).length;
  bool get canCheckout => items.isNotEmpty && issueCount == 0;
}
