import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../../cart/presentation/cart_providers.dart';
import '../../wishlist/presentation/wishlist_providers.dart';
import '../domain/product.dart';
import 'product_providers.dart';

class ProductDetailsPage extends ConsumerStatefulWidget {
  const ProductDetailsPage({required this.productId, super.key});

  final String productId;

  @override
  ConsumerState<ProductDetailsPage> createState() => _ProductDetailsPageState();
}

class _ProductDetailsPageState extends ConsumerState<ProductDetailsPage> {
  String? _selectedVariantId;
  int _quantity = 1;
  int _selectedImageIndex = 0;
  bool _addingToCart = false;
  bool _updatingWishlist = false;

  ProductVariant _selectedVariant(Product product) {
    final selectedId = _selectedVariantId;
    if (selectedId != null) {
      for (final variant in product.variants) {
        if (variant.id == selectedId) {
          return variant;
        }
      }
    }
    return product.defaultVariant;
  }

  List<ProductImage> _imagesFor(Product product, ProductVariant variant) {
    return product.imagesForVariant(variant.id);
  }

  void _selectVariant(ProductVariant variant) {
    setState(() {
      _selectedVariantId = variant.id;
      _quantity = 1;
      _selectedImageIndex = 0;
    });
  }

  void _changeQuantity(ProductVariant variant, int next) {
    if (next < 1 || next > variant.availableStock) {
      return;
    }
    setState(() => _quantity = next);
  }

  Future<void> _addToCart(ProductVariant variant) async {
    if (_addingToCart || !variant.inStock) {
      return;
    }

    final auth = ref.read(authControllerProvider);
    if (!auth.isAuthenticated) {
      _showMessage('Sign in to add products to your cart.');
      return;
    }

    setState(() => _addingToCart = true);
    try {
      await ref.read(cartRepositoryProvider).addItem(
            variant.id,
            quantity: _quantity,
          );
      ref.invalidate(customerCartProvider);

      if (mounted) {
        _showMessage(
          '${_quantity == 1 ? 'Item' : '$_quantity items'} added to cart.',
        );
      }
    } on DioException catch (error) {
      if (mounted) {
        _showMessage(_messageFrom(error, 'Unable to add item to cart.'));
      }
    } catch (_) {
      if (mounted) {
        _showMessage('Unable to add item to cart.');
      }
    } finally {
      if (mounted) {
        setState(() => _addingToCart = false);
      }
    }
  }

  Future<void> _toggleWishlist(String productId) async {
    if (_updatingWishlist) {
      return;
    }

    final auth = ref.read(authControllerProvider);
    if (!auth.isAuthenticated) {
      _showMessage('Sign in to save products.');
      return;
    }

    setState(() => _updatingWishlist = true);
    try {
      await ref.read(wishlistProductIdsProvider.notifier).toggle(productId);
    } on DioException catch (error) {
      if (mounted) {
        _showMessage(_messageFrom(error, 'Unable to update wishlist.'));
      }
    } catch (error) {
      if (mounted) {
        _showMessage(
          error is StateError ? error.message : 'Unable to update wishlist.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _updatingWishlist = false);
      }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Product?> product =
        ref.watch(productProvider(widget.productId));
    final wishlistIds = ref.watch(wishlistProductIdsProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product'),
        actions: <Widget>[
          product.maybeWhen(
            data: (item) {
              if (item == null) {
                return const SizedBox.shrink();
              }
              final isSaved = wishlistIds?.contains(item.id) ?? false;
              return IconButton(
                tooltip: isSaved ? 'Remove from wishlist' : 'Save to wishlist',
                onPressed:
                    _updatingWishlist ? null : () => _toggleWishlist(item.id),
                icon: _updatingWishlist
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        isSaved
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                      ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: product.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text('$error')),
        data: (item) {
          if (item == null) {
            return const Center(child: Text('Product not found'));
          }

          final selectedVariant = _selectedVariant(item);
          final images = _imagesFor(item, selectedVariant);
          final safeImageIndex = images.isEmpty
              ? 0
              : _selectedImageIndex.clamp(0, images.length - 1);

          return ListView(
            padding: const EdgeInsets.all(20),
            children: <Widget>[
              AspectRatio(
                aspectRatio: 1.2,
                child: Container(
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: images.isEmpty
                      ? const Icon(
                          Icons.image_outlined,
                          size: 72,
                          color: Color(0xFF94A3B8),
                        )
                      : Image.network(
                          images[safeImageIndex].url,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(
                            Icons.broken_image_outlined,
                            size: 72,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                ),
              ),
              if (images.length > 1) ...<Widget>[
                const SizedBox(height: 12),
                SizedBox(
                  height: 64,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: images.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final selected = index == safeImageIndex;
                      return InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () =>
                            setState(() => _selectedImageIndex = index),
                        child: Container(
                          width: 64,
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              width: selected ? 2 : 1,
                              color: selected
                                  ? Theme.of(context).colorScheme.primary
                                  : Theme.of(context).dividerColor,
                            ),
                          ),
                          child: Image.network(
                            images[index].url,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.image_not_supported_outlined),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Text(
                item.category.toUpperCase(),
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                item.name,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  Text(
                    'RM ${selectedVariant.price.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  if (selectedVariant.compareAtPrice != null &&
                      selectedVariant.compareAtPrice! >
                          selectedVariant.price) ...<Widget>[
                    const SizedBox(width: 10),
                    Text(
                      'RM ${selectedVariant.compareAtPrice!.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            decoration: TextDecoration.lineThrough,
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 8),
              Text(
                _stockLabel(selectedVariant),
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: selectedVariant.inStock
                      ? Theme.of(context).colorScheme.onSurfaceVariant
                      : Theme.of(context).colorScheme.error,
                ),
              ),
              if (selectedVariant.sku.isNotEmpty) ...<Widget>[
                const SizedBox(height: 4),
                Text(
                  'SKU: ${selectedVariant.sku}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
              if (item.hasMultipleVariants) ...<Widget>[
                const SizedBox(height: 24),
                Text(
                  'Options',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: item.variants.map((variant) {
                    final selected = variant.id == selectedVariant.id;
                    return ChoiceChip(
                      selected: selected,
                      onSelected: (_) => _selectVariant(variant),
                      label: Text(_variantLabel(variant)),
                      avatar: variant.inStock
                          ? null
                          : const Icon(Icons.block_rounded, size: 16),
                    );
                  }).toList(growable: false),
                ),
              ],
              const SizedBox(height: 20),
              Text(item.description),
              const SizedBox(height: 24),
              Row(
                children: <Widget>[
                  Text(
                    'Quantity',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Decrease quantity',
                    onPressed: _quantity > 1
                        ? () => _changeQuantity(
                              selectedVariant,
                              _quantity - 1,
                            )
                        : null,
                    icon: const Icon(Icons.remove_circle_outline_rounded),
                  ),
                  SizedBox(
                    width: 40,
                    child: Text(
                      '$_quantity',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Increase quantity',
                    onPressed: selectedVariant.inStock &&
                            _quantity < selectedVariant.availableStock
                        ? () => _changeQuantity(
                              selectedVariant,
                              _quantity + 1,
                            )
                        : null,
                    icon: const Icon(Icons.add_circle_outline_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: selectedVariant.inStock && !_addingToCart
                    ? () => _addToCart(selectedVariant)
                    : null,
                icon: _addingToCart
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.shopping_bag_outlined),
                label: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Text(
                    selectedVariant.inStock
                        ? (_addingToCart ? 'Adding...' : 'Add to cart')
                        : 'Out of stock',
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

String _variantLabel(ProductVariant variant) {
  if (variant.optionValues.isEmpty) {
    return variant.name;
  }

  final values = variant.optionValues.values
      .map((value) => value.trim())
      .where((value) => value.isNotEmpty)
      .toList(growable: false);

  if (values.isEmpty) {
    return variant.name;
  }
  return values.join(' / ');
}

String _stockLabel(ProductVariant variant) {
  if (!variant.inStock) {
    return 'Out of stock';
  }
  if (variant.availableStock <= 5) {
    return 'Only ${variant.availableStock} left';
  }
  return '${variant.availableStock} available';
}

String _messageFrom(Object error, String fallback) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
    }
  }
  return fallback;
}
