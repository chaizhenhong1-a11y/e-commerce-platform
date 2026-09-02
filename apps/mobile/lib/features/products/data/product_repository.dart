import '../../../core/network/api_client.dart';
import '../domain/product.dart';

class ProductCatalogQuery {
  const ProductCatalogQuery({
    this.query,
    this.category,
    this.sort = 'newest',
    this.minPrice,
    this.maxPrice,
    this.inStock = false,
    this.page,
    this.limit,
  });

  final String? query;
  final String? category;
  final String sort;
  final double? minPrice;
  final double? maxPrice;
  final bool inStock;
  final int? page;
  final int? limit;

  ProductCatalogQuery copyWith({
    int? page,
    int? limit,
  }) {
    return ProductCatalogQuery(
      query: query,
      category: category,
      sort: sort,
      minPrice: minPrice,
      maxPrice: maxPrice,
      inStock: inStock,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }
}

class ProductCatalogPage {
  const ProductCatalogPage({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.hasMore,
  });

  final List<Product> items;
  final int page;
  final int limit;
  final int total;
  final bool hasMore;

  factory ProductCatalogPage.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? const [];
    return ProductCatalogPage(
      items: itemsJson
          .map((item) => Product.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      page: (json['page'] as num?)?.toInt() ?? 1,
      limit: (json['limit'] as num?)?.toInt() ?? itemsJson.length,
      total: (json['total'] as num?)?.toInt() ?? itemsJson.length,
      hasMore: json['hasMore'] == true,
    );
  }
}

class ProductCatalogMetadata {
  const ProductCatalogMetadata({
    required this.categories,
    this.minPrice,
    this.maxPrice,
  });

  final List<String> categories;
  final double? minPrice;
  final double? maxPrice;

  factory ProductCatalogMetadata.fromJson(Map<String, dynamic> json) {
    final categoriesJson = json['categories'] as List<dynamic>? ?? const [];

    return ProductCatalogMetadata(
      categories: categoriesJson
          .whereType<String>()
          .map((value) => value.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
      minPrice: (json['minPrice'] as num?)?.toDouble(),
      maxPrice: (json['maxPrice'] as num?)?.toDouble(),
    );
  }
}

abstract interface class ProductRepository {
  Future<List<Product>> getProducts([
    ProductCatalogQuery filters = const ProductCatalogQuery(),
  ]);
  Future<Product?> getProductById(String id);
}

extension ProductRepositoryPagination on ProductRepository {
  Future<ProductCatalogPage> getProductPage(ProductCatalogQuery filters) async {
    if (this is ApiProductRepository) {
      return (this as ApiProductRepository).getProductPage(filters);
    }

    final items = await getProducts(filters);
    return ProductCatalogPage(
      items: items,
      page: 1,
      limit: items.length,
      total: items.length,
      hasMore: false,
    );
  }
}

extension ProductRepositoryCatalogMetadata on ProductRepository {
  Future<ProductCatalogMetadata> getCatalogMetadata() async {
    if (this is ApiProductRepository) {
      return (this as ApiProductRepository).getCatalogMetadata();
    }

    final products = await getProducts();
    final categories = products
        .map((product) => product.category.trim())
        .where((category) => category.isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    final prices = products
        .expand((product) => product.variants)
        .map((variant) => variant.price)
        .toList(growable: false);

    return ProductCatalogMetadata(
      categories: List<String>.unmodifiable(categories),
      minPrice: prices.isEmpty
          ? null
          : prices.reduce((left, right) => left < right ? left : right),
      maxPrice: prices.isEmpty
          ? null
          : prices.reduce((left, right) => left > right ? left : right),
    );
  }
}

class ApiProductRepository implements ProductRepository {
  ApiProductRepository(this._apiClient);

  final ApiClient _apiClient;

  Map<String, dynamic> _queryParameters(ProductCatalogQuery filters) {
    return <String, dynamic>{
      if (filters.query?.trim().isNotEmpty ?? false) 'q': filters.query!.trim(),
      if (filters.category?.trim().isNotEmpty ?? false)
        'category': filters.category!.trim(),
      if (filters.sort != 'newest') 'sort': filters.sort,
      if (filters.minPrice != null) 'minPrice': filters.minPrice,
      if (filters.maxPrice != null) 'maxPrice': filters.maxPrice,
      if (filters.inStock) 'inStock': true,
      if (filters.page != null) 'page': filters.page,
      if (filters.limit != null) 'limit': filters.limit,
    };
  }

  @override
  Future<List<Product>> getProducts([
    ProductCatalogQuery filters = const ProductCatalogQuery(),
  ]) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/products',
      queryParameters: _queryParameters(filters),
    );
    final data = response.data ?? const <dynamic>[];

    return data
        .map((item) => Product.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<ProductCatalogPage> getProductPage(ProductCatalogQuery filters) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/products',
      queryParameters: _queryParameters(filters),
    );
    return ProductCatalogPage.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  Future<ProductCatalogMetadata> getCatalogMetadata() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/products/catalog-meta',
    );
    return ProductCatalogMetadata.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  @override
  Future<Product?> getProductById(String id) async {
    final products = await getProducts();
    for (final product in products) {
      if (product.id == id) {
        return product;
      }
    }
    return null;
  }
}
