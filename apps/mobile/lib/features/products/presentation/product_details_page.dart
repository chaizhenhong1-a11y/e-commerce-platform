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

class _ProductDetailsPageState extends ConsumerState<ProductDetailsPage>
    with WidgetsBindingObserver {
  String? _selectedVariantId;
  final int _quantity = 1;
  int _selectedImageIndex = 0;
  bool _addingToCart = false;
  bool _updatingWishlist = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    _refreshProductMedia();
  }

  void _refreshProductMedia() {
    ref.invalidate(productProvider(widget.productId));
    ref.invalidate(productsProvider);
    setState(() => _selectedImageIndex = 0);
  }

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

  Future<bool> _addToCart(
    ProductVariant variant, {
    int? quantity,
  }) async {
    if (_addingToCart || !variant.inStock) {
      return false;
    }

    final auth = ref.read(authControllerProvider);
    if (!auth.isAuthenticated) {
      _showMessage('Sign in to add products to your cart.');
      return false;
    }

    final addQuantity = quantity ?? _quantity;
    setState(() => _addingToCart = true);
    try {
      await ref.read(cartRepositoryProvider).addItem(
            variant.id,
            quantity: addQuantity,
          );
      ref.invalidate(customerCartProvider);

      if (mounted) {
        _showMessage(
          '${addQuantity == 1 ? 'Item' : '$addQuantity items'} added to cart.',
        );
      }
      return true;
    } on DioException catch (error) {
      if (mounted) {
        _showMessage(_messageFrom(error, 'Unable to add item to cart.'));
      }
      return false;
    } catch (_) {
      if (mounted) {
        _showMessage('Unable to add item to cart.');
      }
      return false;
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

  List<String> _optionNames(Product product) {
    final names = <String>[];
    for (final variant in product.variants) {
      for (final name in variant.optionValues.keys) {
        if (!names.contains(name)) {
          names.add(name);
        }
      }
    }
    return names;
  }

  String? _optionValue(ProductVariant variant, String optionName) {
    for (final entry in variant.optionValues.entries) {
      if (entry.key.toLowerCase() == optionName.toLowerCase()) {
        return entry.value;
      }
    }
    return null;
  }

  List<String> _optionValues(Product product, String optionName) {
    final values = <String>[];
    for (final variant in product.variants) {
      final value = _optionValue(variant, optionName)?.trim();
      if (value != null && value.isNotEmpty && !values.contains(value)) {
        values.add(value);
      }
    }
    return values;
  }

  bool _matchesSelections(
    ProductVariant variant,
    Map<String, String> selections,
  ) {
    for (final entry in selections.entries) {
      if (_optionValue(variant, entry.key) != entry.value) {
        return false;
      }
    }
    return true;
  }

  bool _canSelectOption(
    Product product,
    ProductVariant selectedVariant,
    String optionName,
    String optionValue,
  ) {
    final selections = <String, String>{};
    for (final name in _optionNames(product)) {
      final value = name.toLowerCase() == optionName.toLowerCase()
          ? optionValue
          : _optionValue(selectedVariant, name);
      if (value != null) {
        selections[name] = value;
      }
    }

    return product.variants.any(
      (variant) => variant.inStock && _matchesSelections(variant, selections),
    );
  }

  ProductVariant? _variantAfterOptionSelection(
    Product product,
    ProductVariant selectedVariant,
    String optionName,
    String optionValue,
  ) {
    final selections = <String, String>{};
    for (final name in _optionNames(product)) {
      final value = name.toLowerCase() == optionName.toLowerCase()
          ? optionValue
          : _optionValue(selectedVariant, name);
      if (value != null) {
        selections[name] = value;
      }
    }

    for (final variant in product.variants) {
      if (variant.inStock && _matchesSelections(variant, selections)) {
        return variant;
      }
    }

    for (final variant in product.variants) {
      if (_matchesSelections(variant, selections)) {
        return variant;
      }
    }
    return null;
  }

  bool _shouldShowOptions(Product product) {
    if (product.hasMultipleVariants) return true;
    return _optionNames(product).any(_isColorOption);
  }

  bool _isColorOption(String optionName) {
    final key = optionName.toLowerCase();
    return key == 'color' || key == 'colour';
  }

  Color? _swatchColor(Product product, String colorName) {
    final hex = product.colorSwatches[colorName]?.trim();
    if (hex == null || !RegExp(r'^#[0-9A-Fa-f]{6}$').hasMatch(hex)) {
      return null;
    }
    return Color(int.parse('FF${hex.substring(1)}', radix: 16));
  }

  Future<void> _showAddToCartSheet(Product product) async {
    var selectedVariant = _selectedVariant(product);
    var quantity = 1;
    var submitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            final optionNames = _optionNames(product);
            final images = _imagesFor(product, selectedVariant);
            final imageUrl = images.isEmpty ? null : images.first.url;

            void selectOption(String optionName, String optionValue) {
              final nextVariant = _variantAfterOptionSelection(
                product,
                selectedVariant,
                optionName,
                optionValue,
              );
              if (nextVariant == null) return;
              setSheetState(() {
                selectedVariant = nextVariant;
                quantity = 1;
              });
            }

            return FractionallySizedBox(
              heightFactor: 0.78,
              child: Column(
                children: <Widget>[
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
                      children: <Widget>[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Container(
                              width: 92,
                              height: 92,
                              clipBehavior: Clip.antiAlias,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: imageUrl == null
                                  ? const Icon(Icons.image_outlined)
                                  : Image.network(
                                      imageUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder:
                                          (context, error, stackTrace) =>
                                              const Icon(
                                        Icons.broken_image_outlined,
                                      ),
                                    ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Text(
                                    product.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(sheetContext)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'RM ${selectedVariant.price.toStringAsFixed(2)}',
                                    style: Theme.of(sheetContext)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.w900,
                                        ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(_stockLabel(selectedVariant)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        ...optionNames.expand((optionName) sync* {
                          yield Text(
                            optionName,
                            style: Theme.of(sheetContext)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          );
                          yield const SizedBox(height: 10);
                          yield Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children:
                                _optionValues(product, optionName).map((value) {
                              final selected =
                                  _optionValue(selectedVariant, optionName) ==
                                      value;
                              final enabled = selected ||
                                  _canSelectOption(
                                    product,
                                    selectedVariant,
                                    optionName,
                                    value,
                                  );
                              final swatch = _isColorOption(optionName)
                                  ? _swatchColor(product, value)
                                  : null;
                              return ChoiceChip(
                                selected: selected,
                                onSelected: enabled
                                    ? (_) => selectOption(optionName, value)
                                    : null,
                                label: Text(value),
                                avatar: swatch == null
                                    ? null
                                    : Container(
                                        width: 18,
                                        height: 18,
                                        decoration: BoxDecoration(
                                          color: swatch,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Theme.of(sheetContext)
                                                .dividerColor,
                                          ),
                                        ),
                                      ),
                              );
                            }).toList(growable: false),
                          );
                          yield const SizedBox(height: 22);
                        }),
                        Row(
                          children: <Widget>[
                            Text(
                              'Quantity',
                              style: Theme.of(sheetContext)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const Spacer(),
                            IconButton(
                              onPressed: quantity > 1
                                  ? () => setSheetState(() => quantity -= 1)
                                  : null,
                              icon: const Icon(
                                  Icons.remove_circle_outline_rounded),
                            ),
                            SizedBox(
                              width: 40,
                              child: Text(
                                '$quantity',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w800),
                              ),
                            ),
                            IconButton(
                              onPressed: selectedVariant.inStock &&
                                      quantity < selectedVariant.availableStock
                                  ? () => setSheetState(() => quantity += 1)
                                  : null,
                              icon:
                                  const Icon(Icons.add_circle_outline_rounded),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                      child: SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: selectedVariant.inStock && !submitting
                              ? () async {
                                  final navigator = Navigator.of(sheetContext);
                                  setSheetState(() => submitting = true);
                                  final added = await _addToCart(
                                    selectedVariant,
                                    quantity: quantity,
                                  );
                                  if (added && navigator.canPop()) {
                                    navigator.pop();
                                    return;
                                  }
                                  setSheetState(() => submitting = false);
                                }
                              : null,
                          icon: submitting
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.shopping_bag_outlined),
                          label: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            child: Text(
                              selectedVariant.inStock
                                  ? (submitting ? 'Adding...' : 'Add to cart')
                                  : 'Out of stock',
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _detailBlock(BuildContext context, Product item) {
    final details = item.details;
    if (details.isEmpty) return const SizedBox.shrink();
    Widget row(String label, String value) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(value),
            ],
          ),
        );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const SizedBox(height: 24),
        Text('Product details',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        if (details.material != null) row('Material', details.material!),
        if (details.dimensions != null)
          row('Dimensions / fit', details.dimensions!),
        if (details.care != null) row('Care', details.care!),
        if (details.highlights.isNotEmpty) ...<Widget>[
          const Text('Highlights',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          ...details.highlights.map((value) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text('• $value'))),
          const SizedBox(height: 8),
        ],
        if (details.specifications.isNotEmpty) ...<Widget>[
          const Text('Specifications',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          ...details.specifications.entries.map((entry) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Expanded(
                          child: Text(entry.key,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600))),
                      const SizedBox(width: 12),
                      Expanded(
                          child: Text(entry.value, textAlign: TextAlign.end)),
                    ]),
              )),
        ],
      ],
    );
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
              const SizedBox(height: 20),
              if (item.description.trim().isNotEmpty) Text(item.description),
              _detailBlock(context, item),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: selectedVariant.inStock && !_addingToCart
                    ? () => _shouldShowOptions(item)
                        ? _showAddToCartSheet(item)
                        : _addToCart(selectedVariant)
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
