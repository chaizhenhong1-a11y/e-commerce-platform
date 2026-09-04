import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../products/presentation/product_providers.dart';
import '../data/staff_repository.dart';
import '../domain/staff_catalog.dart';
import 'staff_providers.dart';
import 'staff_ui_theme.dart';

class StaffProductEditorPage extends ConsumerStatefulWidget {
  const StaffProductEditorPage({super.key, this.productId});

  final String? productId;

  @override
  ConsumerState<StaffProductEditorPage> createState() =>
      _StaffProductEditorPageState();
}

class _StaffProductEditorPageState
    extends ConsumerState<StaffProductEditorPage> {
  static const _statuses = <String>['DRAFT', 'ACTIVE', 'ARCHIVED'];

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _slugController = TextEditingController();
  final _descriptionController = TextEditingController();

  StaffProductEditorOptions? _options;
  StaffCatalogProduct? _product;
  String _status = 'DRAFT';
  String? _categoryId;
  bool _isFeatured = false;
  bool _slugTouched = false;
  bool _loading = true;
  bool _busy = false;
  String? _error;
  String? _success;

  bool get _editing => widget.productId != null;

  StaffRepository get _repository => ref.read(staffRepositoryProvider);

  @override
  void initState() {
    super.initState();
    _slugTouched = _editing;
    _nameController.addListener(_syncSlug);
    Future<void>.microtask(_load);
  }

  @override
  void dispose() {
    _nameController
      ..removeListener(_syncSlug)
      ..dispose();
    _slugController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _syncSlug() {
    if (_slugTouched) return;
    _slugController.text = _slugify(_nameController.text);
  }

  String _slugify(String value) {
    return value
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final options = await _repository.getProductEditorOptions();
      StaffCatalogProduct? product;
      if (_editing) {
        product = await _repository.getProductForStaff(widget.productId!);
      }
      if (!mounted) return;
      _options = options;
      _product = product;
      if (product != null) {
        _nameController.text = product.name;
        _slugController.text = product.slug;
        _descriptionController.text = product.description ?? '';
        _status = product.status;
        _categoryId = product.categoryId;
        _isFeatured = product.isFeatured;
      }
    } catch (error) {
      if (!mounted) return;
      setState(
          () => _error = _message(error, 'Unable to load product editor.'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _message(Object error, String fallback) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message.trim();
        }
        if (message is List && message.isNotEmpty) {
          return message.first.toString();
        }
      }
    }
    return fallback;
  }

  bool get _canPublish =>
      _product?.variants.any((variant) => variant.isActive) ?? false;

  Future<void> _saveProduct() async {
    if (!(_formKey.currentState?.validate() ?? false) || _busy) return;
    if (_editing && _status == 'ACTIVE' && !_canPublish) {
      setState(() {
        _error = 'Add at least one active SKU before publishing.';
        _success = null;
      });
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });

    try {
      if (_editing) {
        await _repository.saveProduct(
          productId: widget.productId!,
          name: _nameController.text,
          slug: _slugController.text,
          description: _descriptionController.text,
          categoryId: _categoryId,
          status: _status,
          isFeatured: _isFeatured,
        );
        await _reloadProduct();
        if (mounted) {
          setState(() => _success = 'Product details saved.');
        }
      } else {
        final created = await _repository.createProduct(
          name: _nameController.text,
          slug: _slugController.text,
          description: _descriptionController.text,
          categoryId: _categoryId,
          isFeatured: _isFeatured,
        );
        if (mounted) {
          context.go('/staff/catalog/products/${created.id}');
        }
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to save product.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reloadProduct() async {
    if (!_editing) return;
    final product = await _repository.getProductForStaff(widget.productId!);
    if (!mounted) return;
    setState(() {
      _product = product;
      _status = product.status;
      _categoryId = product.categoryId;
      _isFeatured = product.isFeatured;
    });

    // Keep customer-facing catalog/detail providers in sync when Staff edits
    // product media in this Flutter session. Cross-tab/web edits are covered
    // by the product-details lifecycle refresh.
    ref.invalidate(productProvider(product.id));
    ref.invalidate(productsProvider);
  }

  Future<void> _generateMatrix() async {
    final productId = widget.productId;
    if (productId == null || _busy) return;
    final draft = await showDialog<_MatrixDraft>(
      context: context,
      builder: (context) => const _VariantMatrixDialog(),
    );
    if (draft == null || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      final result = await _repository.generateVariantMatrix(
        productId: productId,
        options: draft.options,
        skuPrefix: draft.skuPrefix,
        priceCents: draft.priceCents,
        compareAtCents: draft.compareAtCents,
        currency: draft.currency,
        initialQuantity: draft.initialQuantity,
      );
      await _reloadProduct();
      if (mounted) {
        setState(() {
          _success = 'Variant matrix: ${result.createdCount} created, '
              '${result.skippedCount} skipped.';
        });
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to generate variants.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _uploadImageFromDevice() async {
    final productId = widget.productId;
    final product = _product;
    if (productId == null || product == null || _busy) return;

    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const <String>['jpg', 'jpeg', 'png', 'webp'],
      allowMultiple: false,
      withData: true,
    );
    if (picked == null || picked.files.isEmpty || !mounted) return;

    final file = picked.files.single;
    final bytes = file.bytes;
    if (bytes == null) {
      setState(() {
        _error = 'Unable to read the selected image from this device.';
        _success = null;
      });
      return;
    }
    if (bytes.length > 5 * 1024 * 1024) {
      setState(() {
        _error = 'Image must be 5 MB or smaller.';
        _success = null;
      });
      return;
    }

    final extension = (file.extension ?? '').toLowerCase();
    final contentType = switch (extension) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'webp' => 'image/webp',
      _ => null,
    };
    if (contentType == null) {
      setState(() {
        _error = 'Choose a JPG, PNG, or WebP image.';
        _success = null;
      });
      return;
    }

    final draft = await showDialog<_UploadImageDraft>(
      context: context,
      builder: (context) => _UploadImageDialog(
        fileName: file.name,
        fileSize: bytes.length,
        variants: product.variants,
      ),
    );
    if (draft == null || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      await _repository.uploadProductImage(
        productId: productId,
        fileBytes: bytes,
        fileName: file.name,
        contentType: contentType,
        altText: draft.altText,
        variantId: draft.variantId,
        isPrimary: draft.isPrimary,
      );
      await _reloadProduct();
      if (mounted) setState(() => _success = 'Product image uploaded.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to upload image.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addImage() async {
    final productId = widget.productId;
    final product = _product;
    if (productId == null || product == null || _busy) return;

    final draft = await showDialog<_ImageDraft>(
      context: context,
      builder: (context) => _ProductImageDialog(
        variants: product.variants,
      ),
    );
    if (draft == null || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      await _repository.addProductImage(
        productId: productId,
        url: draft.url,
        altText: draft.altText,
        variantId: draft.variantId,
        sortOrder: draft.sortOrder,
        isPrimary: draft.isPrimary,
      );
      await _reloadProduct();
      if (mounted) setState(() => _success = 'Product image added.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to add image.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _editImage(StaffProductImage image) async {
    final product = _product;
    if (product == null || _busy) return;
    final draft = await showDialog<_ImageDraft>(
      context: context,
      builder: (context) => _ProductImageDialog(
        image: image,
        variants: product.variants,
      ),
    );
    if (draft == null || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      await _repository.updateProductImage(
        imageId: image.id,
        altText: draft.altText ?? '',
        variantId: draft.variantId ?? '',
        sortOrder: draft.sortOrder,
        isPrimary: draft.isPrimary,
      );
      await _reloadProduct();
      if (mounted) setState(() => _success = 'Image details saved.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to update image.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _makePrimary(StaffProductImage image) async {
    if (_busy || image.isPrimary) return;
    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      await _repository.updateProductImage(
        imageId: image.id,
        isPrimary: true,
      );
      await _reloadProduct();
      if (mounted) setState(() => _success = 'Primary image updated.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to update image.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _deleteImage(StaffProductImage image) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove image'),
        content: const Text('Remove this product image?'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      await _repository.deleteProductImage(image.id);
      await _reloadProduct();
      if (mounted) setState(() => _success = 'Image removed.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to remove image.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _editVariant([StaffCatalogVariant? variant]) async {
    final productId = widget.productId;
    if (productId == null) return;

    final draft = await showDialog<_VariantDraft>(
      context: context,
      builder: (context) => _VariantEditorDialog(variant: variant),
    );
    if (draft == null || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      if (variant == null) {
        await _repository.createVariant(
          productId: productId,
          sku: draft.sku,
          name: draft.name,
          priceCents: draft.priceCents,
          compareAtCents: draft.compareAtCents,
          currency: draft.currency,
          isActive: draft.isActive,
          initialQuantity: draft.initialQuantity,
          optionValues: draft.optionValues,
        );
        await _reloadProduct();
        if (mounted) setState(() => _success = 'SKU created.');
      } else {
        await _repository.saveVariantDetails(
          variantId: variant.id,
          sku: draft.sku,
          name: draft.name,
          priceCents: draft.priceCents,
          compareAtCents: draft.compareAtCents,
          currency: draft.currency,
          isActive: draft.isActive,
          optionValues: draft.optionValues,
        );
        await _reloadProduct();
        if (mounted) setState(() => _success = 'SKU saved.');
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to save SKU.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _removeVariant(StaffCatalogVariant variant) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove SKU'),
        content: Text(
          'Remove ${variant.sku}? SKUs with commerce or inventory history '
          'will be safely disabled instead of deleted.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      final result = await _repository.removeVariant(variant.id);
      await _reloadProduct();
      if (mounted) {
        setState(() {
          _success = result.message ??
              (result.deleted ? 'SKU deleted.' : 'SKU disabled.');
        });
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to remove SKU.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = _product;
    final categories = _options?.categories ?? const <StaffEditorCategory>[];

    return StaffUiTheme(
        child: Scaffold(
      appBar: AppBar(
        title: Text(_editing ? 'Edit product' : 'New product'),
        actions: <Widget>[
          if (_editing)
            IconButton(
              tooltip: 'Refresh',
              onPressed: _busy ? null : _load,
              icon: const Icon(Icons.refresh_rounded),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: <Widget>[
                if (_error != null) ...<Widget>[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Text(_error!),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                if (_success != null) ...<Widget>[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Text(_success!),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                Form(
                  key: _formKey,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            'Product details',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _nameController,
                            decoration:
                                const InputDecoration(labelText: 'Name'),
                            maxLength: 140,
                            validator: _required,
                          ),
                          const SizedBox(height: 10),
                          TextFormField(
                            controller: _slugController,
                            decoration:
                                const InputDecoration(labelText: 'Slug'),
                            maxLength: 160,
                            onChanged: (_) => _slugTouched = true,
                            validator: (value) {
                              final text = value?.trim() ?? '';
                              if (text.isEmpty) return 'Slug is required.';
                              if (!RegExp(
                                r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
                              ).hasMatch(text)) {
                                return 'Use lowercase letters, numbers and hyphens.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 10),
                          TextFormField(
                            controller: _descriptionController,
                            minLines: 3,
                            maxLines: 7,
                            maxLength: 5000,
                            decoration: const InputDecoration(
                              labelText: 'Description',
                            ),
                          ),
                          const SizedBox(height: 10),
                          DropdownButtonFormField<String?>(
                            initialValue: _categoryId,
                            decoration:
                                const InputDecoration(labelText: 'Category'),
                            items: <DropdownMenuItem<String?>>[
                              const DropdownMenuItem<String?>(
                                value: null,
                                child: Text('No category'),
                              ),
                              ...categories.map(
                                (category) => DropdownMenuItem<String?>(
                                  value: category.id,
                                  child: Text(category.name),
                                ),
                              ),
                            ],
                            onChanged: _busy
                                ? null
                                : (value) =>
                                    setState(() => _categoryId = value),
                          ),
                          if (_editing) ...<Widget>[
                            const SizedBox(height: 10),
                            DropdownButtonFormField<String>(
                              initialValue: _status,
                              decoration:
                                  const InputDecoration(labelText: 'Status'),
                              items: _statuses
                                  .map(
                                    (value) => DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value),
                                    ),
                                  )
                                  .toList(growable: false),
                              onChanged: _busy
                                  ? null
                                  : (value) {
                                      if (value != null) {
                                        setState(() => _status = value);
                                      }
                                    },
                            ),
                          ],
                          const SizedBox(height: 8),
                          SwitchListTile.adaptive(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Featured product'),
                            value: _isFeatured,
                            onChanged: _busy
                                ? null
                                : (value) =>
                                    setState(() => _isFeatured = value),
                          ),
                          if (!_editing)
                            const Padding(
                              padding: EdgeInsets.only(bottom: 12),
                              child: Text(
                                'New products are created as DRAFT. '
                                'Add an active SKU before publishing.',
                              ),
                            ),
                          FilledButton(
                            onPressed: _busy ? null : _saveProduct,
                            child: Text(
                              _editing ? 'Save product' : 'Create draft',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_editing) ...<Widget>[
                  const SizedBox(height: 14),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  'SKUs & variants',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w800),
                                ),
                              ),
                              Wrap(
                                spacing: 8,
                                children: <Widget>[
                                  FilledButton.icon(
                                    onPressed: _busy ? null : _generateMatrix,
                                    icon: const Icon(Icons.grid_view_rounded),
                                    label: const Text('Matrix'),
                                  ),
                                  FilledButton.icon(
                                    onPressed:
                                        _busy ? null : () => _editVariant(),
                                    icon: const Icon(Icons.add_rounded),
                                    label: const Text('Add SKU'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (product == null || product.variants.isEmpty)
                            const Text(
                              'No SKU yet. Add one before publishing.',
                            )
                          else
                            ...product.variants.map(_variantCard),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  'Product media',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w800),
                                ),
                              ),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: <Widget>[
                                  FilledButton.icon(
                                    onPressed:
                                        _busy ? null : _uploadImageFromDevice,
                                    icon: const Icon(
                                      Icons.upload_file_rounded,
                                    ),
                                    label: const Text('Upload image'),
                                  ),
                                  FilledButton.icon(
                                    onPressed: _busy ? null : _addImage,
                                    icon: const Icon(Icons.link_rounded),
                                    label: const Text('Add by URL'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Upload JPG, PNG or WebP directly from this device. '
                            'URL images remain available as an optional fallback.',
                          ),
                          const SizedBox(height: 12),
                          if (product == null || product.images.isEmpty)
                            const Text('No product images yet.')
                          else
                            ...product.images.map(_imageCard),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
    ));
  }

  Widget _imageCard(StaffProductImage image) {
    final product = _product;
    String? assignedSku;
    if (image.variantId != null && product != null) {
      for (final variant in product.variants) {
        if (variant.id == image.variantId) {
          assignedSku = variant.sku;
          break;
        }
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(
                image.isPrimary ? Icons.star_rounded : Icons.image_outlined,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  image.isPrimary ? 'PRIMARY IMAGE' : 'PRODUCT IMAGE',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Text('Order ${image.sortOrder}'),
            ],
          ),
          const SizedBox(height: 6),
          SelectableText(image.url, maxLines: 2),
          if (image.altText != null) ...<Widget>[
            const SizedBox(height: 4),
            Text('Alt: ${image.altText}'),
          ],
          const SizedBox(height: 4),
          Text(
            assignedSku == null
                ? 'Shared product image'
                : 'Assigned to $assignedSku',
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              if (!image.isPrimary)
                TextButton(
                  onPressed: _busy ? null : () => _makePrimary(image),
                  child: const Text('Make primary'),
                ),
              TextButton(
                onPressed: _busy ? null : () => _editImage(image),
                child: const Text('Edit'),
              ),
              TextButton(
                style:
                    TextButton.styleFrom(foregroundColor: Colors.red.shade700),
                onPressed: _busy ? null : () => _deleteImage(image),
                child: const Text('Remove'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _variantCard(StaffCatalogVariant variant) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  '${variant.sku} · ${variant.name}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                '${variant.currency} '
                '${(variant.priceCents / 100).toStringAsFixed(2)}',
              ),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            'Qty ${variant.quantity} · Reserved ${variant.reserved} · '
            'Available ${variant.available} · '
            '${variant.isActive ? 'ACTIVE' : 'INACTIVE'}',
          ),
          if (variant.optionValues.isNotEmpty) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              variant.optionValues.entries
                  .map((entry) => '${entry.key}=${entry.value}')
                  .join(', '),
            ),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              TextButton(
                onPressed: _busy ? null : () => _editVariant(variant),
                child: const Text('Edit'),
              ),
              TextButton(
                style:
                    TextButton.styleFrom(foregroundColor: Colors.red.shade700),
                onPressed: _busy ? null : () => _removeVariant(variant),
                child: const Text('Remove'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) return 'Required.';
    return null;
  }
}

class _MatrixDraft {
  const _MatrixDraft({
    required this.options,
    required this.skuPrefix,
    required this.priceCents,
    required this.currency,
    required this.initialQuantity,
    this.compareAtCents,
  });

  final List<StaffVariantMatrixOption> options;
  final String skuPrefix;
  final int priceCents;
  final int? compareAtCents;
  final String currency;
  final int initialQuantity;
}

class _VariantMatrixDialog extends StatefulWidget {
  const _VariantMatrixDialog();

  @override
  State<_VariantMatrixDialog> createState() => _VariantMatrixDialogState();
}

class _VariantMatrixDialogState extends State<_VariantMatrixDialog> {
  final _formKey = GlobalKey<FormState>();
  final _optionOneName = TextEditingController(text: 'Color');
  final _optionOneValues = TextEditingController();
  final _optionTwoName = TextEditingController(text: 'Size');
  final _optionTwoValues = TextEditingController();
  final _skuPrefix = TextEditingController();
  final _price = TextEditingController();
  final _compareAt = TextEditingController();
  final _quantity = TextEditingController(text: '0');
  final _currency = TextEditingController(text: 'MYR');

  @override
  void dispose() {
    _optionOneName.dispose();
    _optionOneValues.dispose();
    _optionTwoName.dispose();
    _optionTwoValues.dispose();
    _skuPrefix.dispose();
    _price.dispose();
    _compareAt.dispose();
    _quantity.dispose();
    _currency.dispose();
    super.dispose();
  }

  List<String> _values(String text) => text
      .split(',')
      .map((value) => value.trim())
      .where((value) => value.isNotEmpty)
      .toList(growable: false);

  int? _cents(String text) {
    final value = double.tryParse(text.trim());
    if (value == null || !value.isFinite) return null;
    return (value * 100).round();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Generate variant matrix'),
      content: SizedBox(
        width: 520,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                TextFormField(
                  controller: _optionOneName,
                  decoration: const InputDecoration(labelText: 'Option 1'),
                  validator: _required,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _optionOneValues,
                  decoration: const InputDecoration(
                    labelText: 'Option 1 values',
                    hintText: 'Black, White, Purple',
                  ),
                  validator: (value) =>
                      _values(value ?? '').isEmpty ? 'Enter values.' : null,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _optionTwoName,
                  decoration:
                      const InputDecoration(labelText: 'Option 2 (optional)'),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _optionTwoValues,
                  decoration: const InputDecoration(
                    labelText: 'Option 2 values',
                    hintText: 'S, M, L',
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _skuPrefix,
                  decoration: const InputDecoration(
                    labelText: 'SKU prefix',
                    hintText: 'TS-TEE',
                  ),
                  validator: _required,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _price,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Base price'),
                  validator: (value) {
                    final cents = _cents(value ?? '');
                    return cents == null || cents < 0
                        ? 'Enter a valid price.'
                        : null;
                  },
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _compareAt,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Compare-at price (optional)',
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.isEmpty) return null;
                    final compare = _cents(text);
                    final price = _cents(_price.text);
                    return compare == null ||
                            compare < 0 ||
                            (price != null && compare < price)
                        ? 'Must be at least the base price.'
                        : null;
                  },
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _quantity,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Initial inventory per SKU',
                  ),
                  validator: (value) {
                    final quantity = int.tryParse(value?.trim() ?? '');
                    return quantity == null || quantity < 0
                        ? 'Enter a non-negative whole number.'
                        : null;
                  },
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _currency,
                  maxLength: 8,
                  decoration: const InputDecoration(labelText: 'Currency'),
                  validator: _required,
                ),
              ],
            ),
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            if (!(_formKey.currentState?.validate() ?? false)) return;
            final options = <StaffVariantMatrixOption>[
              StaffVariantMatrixOption(
                name: _optionOneName.text.trim(),
                values: _values(_optionOneValues.text),
              ),
            ];
            final secondName = _optionTwoName.text.trim();
            final secondValues = _values(_optionTwoValues.text);
            if (secondName.isNotEmpty && secondValues.isNotEmpty) {
              options.add(
                StaffVariantMatrixOption(
                  name: secondName,
                  values: secondValues,
                ),
              );
            }
            Navigator.pop(
              context,
              _MatrixDraft(
                options: options,
                skuPrefix: _skuPrefix.text.trim(),
                priceCents: _cents(_price.text)!,
                compareAtCents: _compareAt.text.trim().isEmpty
                    ? null
                    : _cents(_compareAt.text),
                currency: _currency.text.trim().toUpperCase(),
                initialQuantity: int.parse(_quantity.text.trim()),
              ),
            );
          },
          child: const Text('Generate'),
        ),
      ],
    );
  }

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Required.' : null;
}

class _UploadImageDraft {
  const _UploadImageDraft({
    required this.isPrimary,
    this.altText,
    this.variantId,
  });

  final String? altText;
  final String? variantId;
  final bool isPrimary;
}

class _UploadImageDialog extends StatefulWidget {
  const _UploadImageDialog({
    required this.fileName,
    required this.fileSize,
    required this.variants,
  });

  final String fileName;
  final int fileSize;
  final List<StaffCatalogVariant> variants;

  @override
  State<_UploadImageDialog> createState() => _UploadImageDialogState();
}

class _UploadImageDialogState extends State<_UploadImageDialog> {
  final _alt = TextEditingController();
  String? _variantId;
  bool _isPrimary = false;

  @override
  void dispose() {
    _alt.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Upload product image'),
      content: SizedBox(
        width: 500,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.image_outlined),
                title: Text(
                  widget.fileName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '${(widget.fileSize / 1024 / 1024).toStringAsFixed(2)} MB',
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _alt,
                maxLength: 220,
                decoration: const InputDecoration(
                  labelText: 'Alt text',
                  hintText: 'Optional image description',
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String?>(
                initialValue: _variantId,
                decoration:
                    const InputDecoration(labelText: 'Variant assignment'),
                items: <DropdownMenuItem<String?>>[
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('Shared product image'),
                  ),
                  ...widget.variants.map(
                    (variant) => DropdownMenuItem<String?>(
                      value: variant.id,
                      child: Text('${variant.sku} · ${variant.name}'),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() => _variantId = value),
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Set as primary image'),
                subtitle: const Text(
                  'The storefront will prefer this image as the product cover.',
                ),
                value: _isPrimary,
                onChanged: (value) => setState(() => _isPrimary = value),
              ),
            ],
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton.icon(
          onPressed: () => Navigator.pop(
            context,
            _UploadImageDraft(
              altText: _alt.text.trim().isEmpty ? null : _alt.text.trim(),
              variantId: _variantId,
              isPrimary: _isPrimary,
            ),
          ),
          icon: const Icon(Icons.cloud_upload_outlined),
          label: const Text('Upload'),
        ),
      ],
    );
  }
}

class _ImageDraft {
  const _ImageDraft({
    required this.url,
    required this.sortOrder,
    required this.isPrimary,
    this.altText,
    this.variantId,
  });

  final String url;
  final String? altText;
  final String? variantId;
  final int sortOrder;
  final bool isPrimary;
}

class _ProductImageDialog extends StatefulWidget {
  const _ProductImageDialog({
    required this.variants,
    this.image,
  });

  final StaffProductImage? image;
  final List<StaffCatalogVariant> variants;

  @override
  State<_ProductImageDialog> createState() => _ProductImageDialogState();
}

class _ProductImageDialogState extends State<_ProductImageDialog> {
  late final TextEditingController _url;
  late final TextEditingController _alt;
  late final TextEditingController _sortOrder;
  String? _variantId;
  late bool _isPrimary;

  bool get _editing => widget.image != null;

  @override
  void initState() {
    super.initState();
    _url = TextEditingController(text: widget.image?.url ?? '');
    _alt = TextEditingController(text: widget.image?.altText ?? '');
    _sortOrder = TextEditingController(text: '${widget.image?.sortOrder ?? 0}');
    _variantId = widget.image?.variantId;
    _isPrimary = widget.image?.isPrimary ?? false;
  }

  @override
  void dispose() {
    _url.dispose();
    _alt.dispose();
    _sortOrder.dispose();
    super.dispose();
  }

  bool _validUrl(String text) {
    final uri = Uri.tryParse(text.trim());
    return uri != null &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.hasAuthority;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_editing ? 'Edit image' : 'Add image'),
      content: SizedBox(
        width: 500,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              TextField(
                controller: _url,
                enabled: !_editing,
                decoration: const InputDecoration(
                  labelText: 'Image URL',
                  hintText: 'https://...',
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _alt,
                maxLength: 220,
                decoration: const InputDecoration(labelText: 'Alt text'),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String?>(
                initialValue: _variantId,
                decoration:
                    const InputDecoration(labelText: 'Variant assignment'),
                items: <DropdownMenuItem<String?>>[
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('Shared product image'),
                  ),
                  ...widget.variants.map(
                    (variant) => DropdownMenuItem<String?>(
                      value: variant.id,
                      child: Text('${variant.sku} · ${variant.name}'),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() => _variantId = value),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _sortOrder,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Display order'),
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Primary image'),
                value: _isPrimary,
                onChanged: (value) => setState(() => _isPrimary = value),
              ),
            ],
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            final url = _url.text.trim();
            if (!_editing && !_validUrl(url)) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Enter a valid http/https URL.')),
              );
              return;
            }
            final sortOrder = int.tryParse(_sortOrder.text.trim());
            if (sortOrder == null || sortOrder < 0) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Display order must be non-negative.'),
                ),
              );
              return;
            }
            Navigator.pop(
              context,
              _ImageDraft(
                url: url,
                altText: _alt.text.trim().isEmpty ? null : _alt.text.trim(),
                variantId: _variantId,
                sortOrder: sortOrder,
                isPrimary: _isPrimary,
              ),
            );
          },
          child: Text(_editing ? 'Save image' : 'Add image'),
        ),
      ],
    );
  }
}

class _VariantDraft {
  const _VariantDraft({
    required this.sku,
    required this.name,
    required this.priceCents,
    required this.currency,
    required this.isActive,
    required this.initialQuantity,
    required this.optionValues,
    this.compareAtCents,
  });

  final String sku;
  final String name;
  final int priceCents;
  final int? compareAtCents;
  final String currency;
  final bool isActive;
  final int initialQuantity;
  final Map<String, String> optionValues;
}

class _VariantEditorDialog extends StatefulWidget {
  const _VariantEditorDialog({this.variant});

  final StaffCatalogVariant? variant;

  @override
  State<_VariantEditorDialog> createState() => _VariantEditorDialogState();
}

class _VariantEditorDialogState extends State<_VariantEditorDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _skuController;
  late final TextEditingController _nameController;
  late final TextEditingController _priceController;
  late final TextEditingController _compareAtController;
  late final TextEditingController _currencyController;
  late final TextEditingController _quantityController;
  late final TextEditingController _optionsController;
  late bool _isActive;

  bool get _editing => widget.variant != null;

  @override
  void initState() {
    super.initState();
    final variant = widget.variant;
    _skuController = TextEditingController(text: variant?.sku ?? '');
    _nameController = TextEditingController(text: variant?.name ?? '');
    _priceController = TextEditingController(
      text:
          variant == null ? '' : (variant.priceCents / 100).toStringAsFixed(2),
    );
    _compareAtController = TextEditingController(
      text: variant?.compareAtCents == null
          ? ''
          : (variant!.compareAtCents! / 100).toStringAsFixed(2),
    );
    _currencyController =
        TextEditingController(text: variant?.currency ?? 'MYR');
    _quantityController = TextEditingController(text: '0');
    _optionsController = TextEditingController(
      text: variant?.optionValues.entries
              .map((entry) => '${entry.key}=${entry.value}')
              .join(', ') ??
          '',
    );
    _isActive = variant?.isActive ?? true;
  }

  @override
  void dispose() {
    _skuController.dispose();
    _nameController.dispose();
    _priceController.dispose();
    _compareAtController.dispose();
    _currencyController.dispose();
    _quantityController.dispose();
    _optionsController.dispose();
    super.dispose();
  }

  int? _moneyToCents(String text) {
    final value = double.tryParse(text.trim());
    if (value == null || !value.isFinite) return null;
    return (value * 100).round();
  }

  Map<String, String> _options(String text) {
    final result = <String, String>{};
    for (final part in text.split(',')) {
      final trimmed = part.trim();
      if (trimmed.isEmpty) continue;
      final separator = trimmed.indexOf('=');
      if (separator <= 0 || separator == trimmed.length - 1) continue;
      final name = trimmed.substring(0, separator).trim();
      final value = trimmed.substring(separator + 1).trim();
      if (name.isNotEmpty && value.isNotEmpty) {
        result[name] = value;
      }
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_editing ? 'Edit SKU' : 'Add SKU'),
      content: SizedBox(
        width: 500,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                TextFormField(
                  controller: _skuController,
                  maxLength: 80,
                  decoration: const InputDecoration(labelText: 'SKU'),
                  validator: _required,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameController,
                  maxLength: 120,
                  decoration: const InputDecoration(labelText: 'Variant name'),
                  validator: _required,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _priceController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Selling price'),
                  validator: (value) {
                    final cents = _moneyToCents(value ?? '');
                    if (cents == null || cents < 0) {
                      return 'Enter a valid non-negative price.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _compareAtController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Compare-at price (optional)',
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.isEmpty) return null;
                    final compare = _moneyToCents(text);
                    final price = _moneyToCents(_priceController.text);
                    if (compare == null ||
                        compare < 0 ||
                        (price != null && compare < price)) {
                      return 'Must be at least the selling price.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _currencyController,
                  maxLength: 8,
                  decoration: const InputDecoration(labelText: 'Currency'),
                  validator: _required,
                ),
                if (!_editing) ...<Widget>[
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _quantityController,
                    keyboardType: TextInputType.number,
                    decoration:
                        const InputDecoration(labelText: 'Initial quantity'),
                    validator: (value) {
                      final quantity = int.tryParse(value?.trim() ?? '');
                      if (quantity == null || quantity < 0) {
                        return 'Enter a non-negative whole number.';
                      }
                      return null;
                    },
                  ),
                ],
                const SizedBox(height: 8),
                TextFormField(
                  controller: _optionsController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Options (optional)',
                    hintText: 'Color=Black, Size=M',
                  ),
                ),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Active SKU'),
                  value: _isActive,
                  onChanged: (value) => setState(() => _isActive = value),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            if (!(_formKey.currentState?.validate() ?? false)) return;
            final priceCents = _moneyToCents(_priceController.text)!;
            final compareText = _compareAtController.text.trim();
            Navigator.pop(
              context,
              _VariantDraft(
                sku: _skuController.text.trim(),
                name: _nameController.text.trim(),
                priceCents: priceCents,
                compareAtCents:
                    compareText.isEmpty ? null : _moneyToCents(compareText),
                currency: _currencyController.text.trim().toUpperCase(),
                isActive: _isActive,
                initialQuantity:
                    int.tryParse(_quantityController.text.trim()) ?? 0,
                optionValues: _options(_optionsController.text),
              ),
            );
          },
          child: Text(_editing ? 'Save SKU' : 'Create SKU'),
        ),
      ],
    );
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) return 'Required.';
    return null;
  }
}
