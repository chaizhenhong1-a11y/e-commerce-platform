import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../../cart/presentation/cart_providers.dart';
import 'package:go_router/go_router.dart';
import '../../wishlist/presentation/wishlist_providers.dart';
import '../../reviews/presentation/product_reviews_section.dart';
import '../domain/product.dart';
import 'product_providers.dart';

class ProductDetailsPage extends ConsumerStatefulWidget {
  const ProductDetailsPage({required this.productId, super.key});

  final String productId;

  @override
  ConsumerState<ProductDetailsPage> createState() =>
      _ProductDetailsPageState();
}

class _ProductDetailsPageState extends ConsumerState<ProductDetailsPage> {
  bool _adding = false;
  String? _selectedVariantId;
  String? _selectedImageId;

  ProductVariant _selectedVariant(Product product) {
    final selectedId = _selectedVariantId;
    if (selectedId != null) {
      for (final variant in product.variants) {
        if (variant.id == selectedId) return variant;
      }
    }
    return product.defaultVariant;
  }

  Future<void> _addToCart(Product product, ProductVariant variant) async {
    if (_adding || !variant.inStock) return;
    if (!ref.read(authControllerProvider).isAuthenticated) {
      context.push('/sign-in?returnTo=${Uri.encodeComponent('/products/${widget.productId}')}');
      return;
    }

    setState(() => _adding = true);
    try {
      await ref.read(cartRepositoryProvider).addItem(variant.id);
      ref.invalidate(customerCartProvider);

      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(
              '${product.name} · ${variant.name} added to cart.',
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
    } on DioException catch (error) {
      if (!mounted) return;
      final data = error.response?.data;
      final message = data is Map<String, dynamic> &&
              data['message'] is String
          ? data['message'] as String
          : 'Unable to add item.';
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(message),
            behavior: SnackBarBehavior.floating,
          ),
        );
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  Future<void> _toggleWishlist(String productId) async {
    if (!ref.read(authControllerProvider).isAuthenticated) {
      context.push('/sign-in?returnTo=${Uri.encodeComponent('/products/${widget.productId}')}');
      return;
    }
    try {
      await ref.read(wishlistProductIdsProvider.notifier).toggle(productId);
    } on StateError {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(content: Text('Sign in to save products.')),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = ref.watch(productProvider(widget.productId));

    return Scaffold(
      appBar: AppBar(title: const Text('Product details')),
      body: product.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _DetailsError(
          onRetry: () => ref.invalidate(productProvider(widget.productId)),
        ),
        data: (item) {
          if (item == null) {
            return const Center(child: Text('Product not found'));
          }

          final selectedVariant = _selectedVariant(item);
          final wishlist = ref.watch(wishlistProductIdsProvider);
          final wishlistIds = wishlist.valueOrNull ?? <String>{};
          final isWishlisted = wishlistIds.contains(item.id);

          return LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 760;

              if (wide) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(28),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1100),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Expanded(
                            child: _ProductVisual(
                              product: item,
                              variant: selectedVariant,
                              selectedImageId: _selectedImageId,
                              onImageSelected: (imageId) {
                                setState(() => _selectedImageId = imageId);
                              },
                            ),
                          ),
                          const SizedBox(width: 42),
                          Expanded(
                            child: Column(
                              children: <Widget>[
                                _ProductInformation(
                                  product: item,
                                  selectedVariant: selectedVariant,
                                  adding: _adding,
                                  isWishlisted: isWishlisted,
                                  onVariantSelected: (variant) {
                                    setState(() {
                                      _selectedVariantId = variant.id;
                                      _selectedImageId = null;
                                    });
                                  },
                                  onWishlistTap: () =>
                                      _toggleWishlist(item.id),
                                  onAdd: () =>
                                      _addToCart(item, selectedVariant),
                                ),
                                const SizedBox(height: 18),
                                ProductReviewsSection(productId: item.id),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return ListView(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 36),
                children: <Widget>[
                  _ProductVisual(
                    product: item,
                    variant: selectedVariant,
                    selectedImageId: _selectedImageId,
                    onImageSelected: (imageId) {
                      setState(() => _selectedImageId = imageId);
                    },
                  ),
                  const SizedBox(height: 24),
                  _ProductInformation(
                    product: item,
                    selectedVariant: selectedVariant,
                    adding: _adding,
                    isWishlisted: isWishlisted,
                    onVariantSelected: (variant) {
                      setState(() {
                        _selectedVariantId = variant.id;
                        _selectedImageId = null;
                      });
                    },
                    onWishlistTap: () => _toggleWishlist(item.id),
                    onAdd: () => _addToCart(item, selectedVariant),
                  ),
                  const SizedBox(height: 18),
                  ProductReviewsSection(productId: item.id),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

class _ProductVisual extends StatelessWidget {
  const _ProductVisual({
    required this.product,
    required this.variant,
    required this.selectedImageId,
    required this.onImageSelected,
  });

  final Product product;
  final ProductVariant variant;
  final String? selectedImageId;
  final ValueChanged<String> onImageSelected;

  @override
  Widget build(BuildContext context) {
    final images = product.imagesForVariant(variant.id);
    ProductImage? selectedImage;

    if (selectedImageId != null) {
      for (final image in images) {
        if (image.id == selectedImageId) {
          selectedImage = image;
          break;
        }
      }
    }

    if (selectedImage == null && images.isNotEmpty) {
      for (final image in images) {
        if (image.isPrimary) {
          selectedImage = image;
          break;
        }
      }
      selectedImage ??= images.first;
    }

    return Column(
      children: <Widget>[
        AspectRatio(
          aspectRatio: 1,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: selectedImage != null
                ? Image.network(
                    selectedImage.url,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const _VisualFallback(),
                  )
                : const _VisualFallback(),
          ),
        ),
        if (images.length > 1) ...<Widget>[
          const SizedBox(height: 12),
          SizedBox(
            height: 76,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final image = images[index];
                final selected = image.id == selectedImage?.id;

                return InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => onImageSelected(image.id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    width: 76,
                    padding: EdgeInsets.all(selected ? 2 : 0),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: selected
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context)
                                .colorScheme
                                .outlineVariant,
                        width: selected ? 2 : 1,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(11),
                      child: Image.network(
                        image.url,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            const _VisualFallback(),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}

class _VisualFallback extends StatelessWidget {
  const _VisualFallback();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Center(
        child: Icon(
          Icons.inventory_2_outlined,
          size: 86,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _ProductInformation extends StatelessWidget {
  const _ProductInformation({
    required this.product,
    required this.selectedVariant,
    required this.adding,
    required this.isWishlisted,
    required this.onVariantSelected,
    required this.onWishlistTap,
    required this.onAdd,
  });

  final Product product;
  final ProductVariant selectedVariant;
  final bool adding;
  final bool isWishlisted;
  final ValueChanged<ProductVariant> onVariantSelected;
  final VoidCallback onWishlistTap;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final compareAt = selectedVariant.compareAtPrice;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          product.category.toUpperCase(),
          style: theme.textTheme.labelMedium?.copyWith(
            color: theme.colorScheme.primary,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(
              child: Text(
                product.name,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  height: 1.08,
                ),
              ),
            ),
            const SizedBox(width: 12),
            IconButton.filledTonal(
              tooltip: isWishlisted
                  ? 'Remove from wishlist'
                  : 'Save to wishlist',
              onPressed: onWishlistTap,
              icon: Icon(
                isWishlisted
                    ? Icons.favorite_rounded
                    : Icons.favorite_border_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 10,
          runSpacing: 6,
          children: <Widget>[
            Text(
              'RM ${selectedVariant.price.toStringAsFixed(2)}',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
              ),
            ),
            if (compareAt != null && compareAt > selectedVariant.price)
              Text(
                'RM ${compareAt.toStringAsFixed(2)}',
                style: theme.textTheme.bodyLarge?.copyWith(
                  decoration: TextDecoration.lineThrough,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
          ],
        ),
        const SizedBox(height: 20),
        _VariantSelector(
          variants: product.variants,
          selectedVariant: selectedVariant,
          onSelected: onVariantSelected,
        ),
        const SizedBox(height: 18),
        Row(
          children: <Widget>[
            Icon(
              selectedVariant.inStock
                  ? Icons.check_circle_outline_rounded
                  : Icons.cancel_outlined,
              size: 19,
              color: selectedVariant.inStock
                  ? theme.colorScheme.primary
                  : theme.colorScheme.error,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                selectedVariant.inStock
                    ? '${selectedVariant.availableStock} available · '
                        '${selectedVariant.sku}'
                    : 'Out of stock · ${selectedVariant.sku}',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        const SizedBox(height: 26),
        Text(
          product.description.isEmpty
              ? 'A carefully selected product from TextShop.'
              : product.description,
          style: theme.textTheme.bodyLarge?.copyWith(
            height: 1.55,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 24),
        DecoratedBox(
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: <Widget>[
                const Icon(Icons.verified_outlined),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Live inventory · Server-verified pricing · '
                    'Secure checkout',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed:
                adding || !selectedVariant.inStock ? null : onAdd,
            icon: adding
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.shopping_bag_outlined),
            label: Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Text(
                adding
                    ? 'Adding…'
                    : selectedVariant.inStock
                        ? 'Add ${selectedVariant.name} to cart'
                        : 'Out of stock',
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _VariantSelector extends StatelessWidget {
  const _VariantSelector({
    required this.variants,
    required this.selectedVariant,
    required this.onSelected,
  });

  final List<ProductVariant> variants;
  final ProductVariant selectedVariant;
  final ValueChanged<ProductVariant> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final optionNames = <String>[];
    for (final variant in variants) {
      for (final name in variant.optionValues.keys) {
        if (!optionNames.contains(name)) optionNames.add(name);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: optionNames.asMap().entries.map((optionEntry) {
        final optionIndex = optionEntry.key;
        final optionName = optionEntry.value;
        final values = <String>[];
        for (final variant in variants) {
          final value = variant.optionValues[optionName];
          if (value != null && !values.contains(value)) values.add(value);
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Text(
                    optionName,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    selectedVariant.optionValues[optionName] ?? '',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: values.map((value) {
                  final selected =
                      selectedVariant.optionValues[optionName] == value;
                  final candidates = variants.where((variant) {
                    if (!variant.inStock ||
                        variant.optionValues[optionName] != value) {
                      return false;
                    }
                    for (final previousName
                        in optionNames.take(optionIndex)) {
                      if (variant.optionValues[previousName] !=
                          selectedVariant.optionValues[previousName]) {
                        return false;
                      }
                    }
                    return true;
                  }).toList(growable: false);
                  final available = candidates.isNotEmpty;

                  return ChoiceChip(
                    selected: selected,
                    onSelected: available
                        ? (_) {
                            final exact = candidates.first;
                            onSelected(exact);
                          }
                        : null,
                    label: Text(
                      value,
                      style: TextStyle(
                        fontWeight:
                            selected ? FontWeight.w900 : FontWeight.w700,
                      ),
                    ),
                  );
                }).toList(growable: false),
              ),
            ],
          ),
        );
      }).toList(growable: false),
    );
  }
}

class _DetailsError extends StatelessWidget {
  const _DetailsError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.cloud_off_outlined, size: 52),
            const SizedBox(height: 16),
            Text(
              'Could not load product',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 20),
            FilledButton.tonal(
              onPressed: onRetry,
              child: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}
