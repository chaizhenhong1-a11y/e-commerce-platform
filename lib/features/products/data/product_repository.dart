import '../domain/product.dart';

abstract interface class ProductRepository {
  Future<List<Product>> getProducts();
  Future<Product?> getProductById(String id);
}

class MockProductRepository implements ProductRepository {
  static const List<Product> _products = <Product>[
    Product(
      id: 'classic-shirt',
      name: 'Classic Shirt',
      description:
          'A clean everyday shirt designed for comfort and simple styling.',
      price: 79.90,
      category: 'Clothing',
    ),
    Product(
      id: 'canvas-tote',
      name: 'Canvas Tote',
      description: 'Minimal canvas tote for daily essentials.',
      price: 39.90,
      category: 'Accessories',
    ),
    Product(
      id: 'daily-cap',
      name: 'Daily Cap',
      description: 'Lightweight cap with a simple everyday fit.',
      price: 49.90,
      category: 'Accessories',
    ),
    Product(
      id: 'oversized-tee',
      name: 'Oversized Tee',
      description: 'Relaxed fit tee made for casual everyday wear.',
      price: 59.90,
      category: 'Clothing',
    ),
  ];

  @override
  Future<List<Product>> getProducts() async => _products;

  @override
  Future<Product?> getProductById(String id) async {
    for (final Product product in _products) {
      if (product.id == id) return product;
    }
    return null;
  }
}
