import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/staff_commerce_summary.dart';
import '../domain/staff_catalog.dart';
import '../domain/staff_category.dart';
import '../domain/staff_order.dart';
import '../domain/staff_promotion.dart';
import '../domain/staff_return_case.dart';
import '../domain/staff_refund_case.dart';

class StaffRepository {
  const StaffRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<StaffCommerceSummary> getCommerceSummary() async {
    final response =
        await _apiClient.dio.get<Map<String, dynamic>>('/staff/orders/summary');
    final data = response.data;
    if (data == null) {
      throw StateError('Staff summary response was empty.');
    }
    return StaffCommerceSummary.fromJson(data);
  }

  Future<List<StaffOrder>> getOrders({
    String? status,
    String? paymentStatus,
    String? query,
  }) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/staff/orders',
      queryParameters: <String, dynamic>{
        if (status != null && status != 'ALL') 'status': status,
        if (paymentStatus != null && paymentStatus != 'ALL')
          'paymentStatus': paymentStatus,
        if (query?.trim().isNotEmpty ?? false) 'q': query!.trim(),
      },
    );
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(StaffOrder.fromJson)
        .toList(growable: false);
  }

  Future<void> startProcessing(String orderNumber) async {
    await _apiClient.dio.post<void>(
      '/staff/orders/${Uri.encodeComponent(orderNumber)}/process',
    );
  }

  Future<void> shipOrder({
    required String orderNumber,
    required String courierName,
    required String trackingNumber,
    String? trackingUrl,
  }) async {
    await _apiClient.dio.post<void>(
      '/staff/orders/${Uri.encodeComponent(orderNumber)}/ship',
      data: <String, dynamic>{
        'courierName': courierName.trim(),
        'trackingNumber': trackingNumber.trim(),
        if (trackingUrl?.trim().isNotEmpty ?? false)
          'trackingUrl': trackingUrl!.trim(),
      },
    );
  }

  Future<void> markDelivered(String orderNumber) async {
    await _apiClient.dio.post<void>(
      '/staff/orders/${Uri.encodeComponent(orderNumber)}/deliver',
    );
  }

  Future<List<StaffRefundCase>> getRefunds({String? status}) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/staff/refunds',
      queryParameters: <String, dynamic>{
        if (status != null && status != 'ALL') 'status': status,
      },
    );
    final data = response.data ?? const <dynamic>[];
    return data.whereType<Map<String, dynamic>>().map(StaffRefundCase.fromJson).toList(growable: false);
  }

  Future<void> approveRefund(String refundId) async {
    await _apiClient.dio.post<void>('/staff/refunds/${Uri.encodeComponent(refundId)}/approve');
  }

  Future<void> rejectRefund(String refundId, {String note = ''}) async {
    await _apiClient.dio.post<void>(
      '/staff/refunds/${Uri.encodeComponent(refundId)}/reject',
      data: <String, dynamic>{'note': note.trim()},
    );
  }

  Future<List<StaffReturnCase>> getReturns({String? status}) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/staff/returns',
      queryParameters: <String, dynamic>{
        if (status != null && status != 'ALL') 'status': status,
      },
    );
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(StaffReturnCase.fromJson)
        .toList(growable: false);
  }

  Future<void> approveReturn(String returnId, {String note = ''}) async {
    await _apiClient.dio.post<void>(
      '/staff/returns/${Uri.encodeComponent(returnId)}/approve',
      data: <String, dynamic>{'note': note.trim()},
    );
  }

  Future<void> rejectReturn(String returnId, {String note = ''}) async {
    await _apiClient.dio.post<void>(
      '/staff/returns/${Uri.encodeComponent(returnId)}/reject',
      data: <String, dynamic>{'note': note.trim()},
    );
  }

  Future<void> markReturnInTransit(String returnId) async {
    await _apiClient.dio.post<void>(
      '/staff/returns/${Uri.encodeComponent(returnId)}/in-transit',
      data: const <String, dynamic>{},
    );
  }

  Future<void> receiveReturn(String returnId) async {
    await _apiClient.dio.post<void>(
      '/staff/returns/${Uri.encodeComponent(returnId)}/receive',
      data: const <String, dynamic>{},
    );
  }

  Future<void> inspectReturn(
    String returnId,
    List<StaffReturnInspection> items,
  ) async {
    await _apiClient.dio.post<void>(
      '/staff/returns/${Uri.encodeComponent(returnId)}/inspect',
      data: <String, dynamic>{
        'items': items.map((item) => item.toJson()).toList(growable: false),
      },
    );
  }

  Future<void> completeReturn(String returnId) async {
    await _apiClient.dio.post<void>(
      '/staff/returns/${Uri.encodeComponent(returnId)}/complete',
      data: const <String, dynamic>{},
    );
  }

  Future<List<StaffCategory>> getCategories() async {
    final response =
        await _apiClient.dio.get<List<dynamic>>('/staff/categories');
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(StaffCategory.fromJson)
        .toList(growable: false);
  }

  Future<StaffCategory> createCategory({
    required String name,
    required String slug,
    required bool isActive,
    required int sortOrder,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/staff/categories',
      data: <String, dynamic>{
        'name': name.trim(),
        'slug': slug.trim(),
        'isActive': isActive,
        'sortOrder': sortOrder,
      },
    );
    final data = response.data;
    if (data == null) throw StateError('Created category response was empty.');
    return StaffCategory.fromJson(data);
  }

  Future<void> updateCategory({
    required String categoryId,
    required String name,
    required String slug,
    required bool isActive,
    required int sortOrder,
  }) async {
    await _apiClient.dio.patch<void>(
      '/staff/categories/${Uri.encodeComponent(categoryId)}',
      data: <String, dynamic>{
        'name': name.trim(),
        'slug': slug.trim(),
        'isActive': isActive,
        'sortOrder': sortOrder,
      },
    );
  }

  Future<void> deleteCategory(String categoryId) async {
    await _apiClient.dio.delete<void>(
      '/staff/categories/${Uri.encodeComponent(categoryId)}',
    );
  }

  Future<List<StaffCouponPromotion>> getCouponPromotions() async {
    final response =
        await _apiClient.dio.get<List<dynamic>>('/staff/promotions');
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(StaffCouponPromotion.fromJson)
        .toList(growable: false);
  }

  Future<void> createCouponPromotion({
    required String code,
    required String name,
    String? description,
    required StaffPromotionDiscountType discountType,
    required int value,
    required int minSubtotalCents,
    int? maxDiscountCents,
    DateTime? startsAt,
    DateTime? endsAt,
    int? usageLimit,
    int? perUserLimit,
    required bool isActive,
    required List<String> productIds,
    required List<String> categoryIds,
  }) async {
    await _apiClient.dio.post<void>(
      '/staff/promotions',
      data: _couponPayload(
        code: code,
        name: name,
        description: description,
        discountType: discountType,
        value: value,
        minSubtotalCents: minSubtotalCents,
        maxDiscountCents: maxDiscountCents,
        startsAt: startsAt,
        endsAt: endsAt,
        usageLimit: usageLimit,
        perUserLimit: perUserLimit,
        isActive: isActive,
        productIds: productIds,
        categoryIds: categoryIds,
      ),
    );
  }

  Future<void> updateCouponPromotion({
    required String promotionId,
    required String code,
    required String name,
    String? description,
    required StaffPromotionDiscountType discountType,
    required int value,
    required int minSubtotalCents,
    int? maxDiscountCents,
    DateTime? startsAt,
    DateTime? endsAt,
    int? usageLimit,
    int? perUserLimit,
    required bool isActive,
    required List<String> productIds,
    required List<String> categoryIds,
  }) async {
    await _apiClient.dio.patch<void>(
      '/staff/promotions/${Uri.encodeComponent(promotionId)}',
      data: _couponPayload(
        code: code,
        name: name,
        description: description,
        discountType: discountType,
        value: value,
        minSubtotalCents: minSubtotalCents,
        maxDiscountCents: maxDiscountCents,
        startsAt: startsAt,
        endsAt: endsAt,
        usageLimit: usageLimit,
        perUserLimit: perUserLimit,
        isActive: isActive,
        productIds: productIds,
        categoryIds: categoryIds,
      ),
    );
  }

  Future<void> deactivateCouponPromotion(String promotionId) async {
    await _apiClient.dio.post<void>(
      '/staff/promotions/${Uri.encodeComponent(promotionId)}/deactivate',
    );
  }

  Future<List<StaffAutomaticPromotion>> getAutomaticPromotions() async {
    final response =
        await _apiClient.dio.get<List<dynamic>>('/staff/promotions/automatic');
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(StaffAutomaticPromotion.fromJson)
        .toList(growable: false);
  }

  Future<void> createAutomaticPromotion({
    required String name,
    String? description,
    required StaffPromotionDiscountType discountType,
    required int value,
    required int minSubtotalCents,
    int? maxDiscountCents,
    DateTime? startsAt,
    DateTime? endsAt,
    required int priority,
    required bool isActive,
    required List<String> productIds,
    required List<String> categoryIds,
  }) async {
    await _apiClient.dio.post<void>(
      '/staff/promotions/automatic',
      data: _automaticPayload(
        name: name,
        description: description,
        discountType: discountType,
        value: value,
        minSubtotalCents: minSubtotalCents,
        maxDiscountCents: maxDiscountCents,
        startsAt: startsAt,
        endsAt: endsAt,
        priority: priority,
        isActive: isActive,
        productIds: productIds,
        categoryIds: categoryIds,
      ),
    );
  }

  Future<void> updateAutomaticPromotion({
    required String promotionId,
    required String name,
    String? description,
    required StaffPromotionDiscountType discountType,
    required int value,
    required int minSubtotalCents,
    int? maxDiscountCents,
    DateTime? startsAt,
    DateTime? endsAt,
    required int priority,
    required bool isActive,
    required List<String> productIds,
    required List<String> categoryIds,
  }) async {
    await _apiClient.dio.patch<void>(
      '/staff/promotions/automatic/${Uri.encodeComponent(promotionId)}',
      data: _automaticPayload(
        name: name,
        description: description,
        discountType: discountType,
        value: value,
        minSubtotalCents: minSubtotalCents,
        maxDiscountCents: maxDiscountCents,
        startsAt: startsAt,
        endsAt: endsAt,
        priority: priority,
        isActive: isActive,
        productIds: productIds,
        categoryIds: categoryIds,
      ),
    );
  }

  Future<void> deactivateAutomaticPromotion(String promotionId) async {
    await _apiClient.dio.post<void>(
      '/staff/promotions/automatic/${Uri.encodeComponent(promotionId)}/deactivate',
    );
  }

  Future<StaffPromotionEditorOptions> getPromotionEditorOptions() async {
    final results = await Future.wait<dynamic>([
      getCatalog(),
      getCategories(),
    ]);
    final products = results[0] as List<StaffCatalogProduct>;
    final categories = results[1] as List<StaffCategory>;
    return StaffPromotionEditorOptions(
      products: products
          .map((item) => StaffPromotionCatalogOption(
                id: item.id,
                name: item.name,
              ))
          .toList(growable: false),
      categories: categories
          .map((item) => StaffPromotionCatalogOption(
                id: item.id,
                name: item.name,
              ))
          .toList(growable: false),
    );
  }

  Map<String, dynamic> _couponPayload({
    required String code,
    required String name,
    String? description,
    required StaffPromotionDiscountType discountType,
    required int value,
    required int minSubtotalCents,
    int? maxDiscountCents,
    DateTime? startsAt,
    DateTime? endsAt,
    int? usageLimit,
    int? perUserLimit,
    required bool isActive,
    required List<String> productIds,
    required List<String> categoryIds,
  }) {
    return <String, dynamic>{
      'code': code.trim().toUpperCase().replaceAll(RegExp(r'\s+'), ''),
      'name': name.trim(),
      if (description?.trim().isNotEmpty ?? false)
        'description': description!.trim(),
      'discountType': discountType.apiValue,
      'value': value,
      'minSubtotalCents': minSubtotalCents,
      'maxDiscountCents': maxDiscountCents,
      'startsAt': startsAt?.toUtc().toIso8601String(),
      'endsAt': endsAt?.toUtc().toIso8601String(),
      'usageLimit': usageLimit,
      'perUserLimit': perUserLimit,
      'isActive': isActive,
      'productIds': productIds,
      'categoryIds': categoryIds,
    };
  }

  Map<String, dynamic> _automaticPayload({
    required String name,
    String? description,
    required StaffPromotionDiscountType discountType,
    required int value,
    required int minSubtotalCents,
    int? maxDiscountCents,
    DateTime? startsAt,
    DateTime? endsAt,
    required int priority,
    required bool isActive,
    required List<String> productIds,
    required List<String> categoryIds,
  }) {
    return <String, dynamic>{
      'name': name.trim(),
      if (description?.trim().isNotEmpty ?? false)
        'description': description!.trim(),
      'discountType': discountType.apiValue,
      'value': value,
      'minSubtotalCents': minSubtotalCents,
      'maxDiscountCents': maxDiscountCents,
      'startsAt': startsAt?.toUtc().toIso8601String(),
      'endsAt': endsAt?.toUtc().toIso8601String(),
      'priority': priority,
      'isActive': isActive,
      'productIds': productIds,
      'categoryIds': categoryIds,
    };
  }

  Future<List<StaffCatalogProduct>> getCatalog({
    String? query,
    String? status,
    bool lowStock = false,
  }) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/staff/catalog',
      queryParameters: <String, dynamic>{
        if (query?.trim().isNotEmpty ?? false) 'q': query!.trim(),
        if (status != null && status != 'ALL') 'status': status,
        if (lowStock) 'lowStock': 'true',
      },
    );
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(StaffCatalogProduct.fromJson)
        .toList(growable: false);
  }

  Future<StaffInventoryAdjustmentResult> adjustInventory({
    required String variantId,
    required int delta,
    required String reason,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/staff/catalog/variants/${Uri.encodeComponent(variantId)}/inventory/adjust',
      data: <String, dynamic>{
        'delta': delta,
        'reason': reason.trim(),
      },
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Inventory adjustment response was empty.');
    }
    return StaffInventoryAdjustmentResult.fromJson(data);
  }

  Future<List<StaffInventoryAdjustment>> getInventoryHistory(
    String variantId,
  ) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/staff/catalog/variants/${Uri.encodeComponent(variantId)}/inventory/history',
    );
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(StaffInventoryAdjustment.fromJson)
        .toList(growable: false);
  }

  Future<StaffProductEditorOptions> getProductEditorOptions() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/staff/catalog/editor/options',
    );
    return StaffProductEditorOptions.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  Future<StaffCatalogProduct> getProductForStaff(String productId) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}',
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Product response was empty.');
    }
    return StaffCatalogProduct.fromJson(data);
  }

  Future<StaffCatalogProduct> createProduct({
    required String name,
    required String slug,
    required String description,
    required Map<String, dynamic> details,
    required Map<String, String> colorSwatches,
    String? categoryId,
    required bool isFeatured,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/staff/catalog/products',
      data: <String, dynamic>{
        'name': name.trim(),
        'slug': slug.trim(),
        'description': description.trim(),
        'details': details,
        'colorSwatches': colorSwatches,
        'categoryId': categoryId,
        'status': 'DRAFT',
        'isFeatured': isFeatured,
      },
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Created product response was empty.');
    }
    return StaffCatalogProduct.fromJson(data);
  }

  Future<void> updateProductStatus({
    required String productId,
    required String status,
  }) async {
    await _apiClient.dio.patch<void>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}',
      data: <String, dynamic>{'status': status},
    );
  }

  Future<StaffProductDeleteResult> deleteProduct(String productId) async {
    final response = await _apiClient.dio.delete<Map<String, dynamic>>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}',
    );
    return StaffProductDeleteResult.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  Future<void> saveProduct({
    required String productId,
    required String name,
    required String slug,
    required String description,
    required Map<String, dynamic> details,
    required Map<String, String> colorSwatches,
    String? categoryId,
    required String status,
    required bool isFeatured,
  }) async {
    await _apiClient.dio.put<void>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}',
      data: <String, dynamic>{
        'name': name.trim(),
        'slug': slug.trim(),
        'description': description.trim(),
        'details': details,
        'colorSwatches': colorSwatches,
        'categoryId': categoryId,
        'status': status,
        'isFeatured': isFeatured,
      },
    );
  }

  Future<void> createVariant({
    required String productId,
    required String sku,
    required String name,
    required int priceCents,
    int? compareAtCents,
    required String currency,
    required bool isActive,
    required int initialQuantity,
    required Map<String, String> optionValues,
  }) async {
    await _apiClient.dio.post<void>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}/variants',
      data: <String, dynamic>{
        'sku': sku.trim(),
        'name': name.trim(),
        'priceCents': priceCents,
        'compareAtCents': compareAtCents,
        'currency': currency.trim().toUpperCase(),
        'isActive': isActive,
        'initialQuantity': initialQuantity,
        'optionValues': optionValues,
      },
    );
  }

  Future<void> saveVariantDetails({
    required String variantId,
    required String sku,
    required String name,
    required int priceCents,
    int? compareAtCents,
    required String currency,
    required bool isActive,
    required Map<String, String> optionValues,
  }) async {
    await _apiClient.dio.patch<void>(
      '/staff/catalog/variants/${Uri.encodeComponent(variantId)}/details',
      data: <String, dynamic>{
        'sku': sku.trim(),
        'name': name.trim(),
        'priceCents': priceCents,
        'compareAtCents': compareAtCents,
        'currency': currency.trim().toUpperCase(),
        'isActive': isActive,
        'optionValues': optionValues,
      },
    );
  }

  Future<StaffVariantRemovalResult> removeVariant(String variantId) async {
    final response = await _apiClient.dio.delete<Map<String, dynamic>>(
      '/staff/catalog/variants/${Uri.encodeComponent(variantId)}',
    );
    return StaffVariantRemovalResult.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  Future<StaffVariantMatrixResult> generateVariantMatrix({
    required String productId,
    required List<StaffVariantMatrixOption> options,
    required String skuPrefix,
    required int priceCents,
    int? compareAtCents,
    required String currency,
    required int initialQuantity,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}/variant-matrix',
      data: <String, dynamic>{
        'options':
            options.map((option) => option.toJson()).toList(growable: false),
        'skuPrefix': skuPrefix.trim(),
        'priceCents': priceCents,
        'compareAtCents': compareAtCents,
        'currency': currency.trim().toUpperCase(),
        'initialQuantity': initialQuantity,
      },
    );
    return StaffVariantMatrixResult.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  Future<void> uploadProductImage({
    required String productId,
    required List<int> fileBytes,
    required String fileName,
    required String contentType,
    String? altText,
    String? variantId,
    required bool isPrimary,
  }) async {
    final formData = FormData.fromMap(<String, dynamic>{
      'file': MultipartFile.fromBytes(
        fileBytes,
        filename: fileName,
        contentType: DioMediaType.parse(contentType),
      ),
      'altText': altText?.trim() ?? '',
      'variantId': variantId ?? '',
      'isPrimary': isPrimary.toString(),
    });

    await _apiClient.dio.post<void>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}/images/upload',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
  }

  Future<void> addProductImage({
    required String productId,
    required String url,
    String? altText,
    String? variantId,
    required int sortOrder,
    required bool isPrimary,
  }) async {
    await _apiClient.dio.post<void>(
      '/staff/catalog/products/${Uri.encodeComponent(productId)}/images',
      data: <String, dynamic>{
        'url': url.trim(),
        'altText': altText?.trim(),
        'variantId': variantId,
        'sortOrder': sortOrder,
        'isPrimary': isPrimary,
      },
    );
  }

  Future<void> updateProductImage({
    required String imageId,
    String? altText,
    String? variantId,
    int? sortOrder,
    bool? isPrimary,
  }) async {
    await _apiClient.dio.patch<void>(
      '/staff/catalog/images/${Uri.encodeComponent(imageId)}',
      data: <String, dynamic>{
        if (altText != null) 'altText': altText.trim(),
        if (variantId != null) 'variantId': variantId,
        if (sortOrder != null) 'sortOrder': sortOrder,
        if (isPrimary != null) 'isPrimary': isPrimary,
      },
    );
  }

  Future<void> deleteProductImage(String imageId) async {
    await _apiClient.dio.delete<void>(
      '/staff/catalog/images/${Uri.encodeComponent(imageId)}',
    );
  }
}

class StaffProductDeleteResult {
  const StaffProductDeleteResult({
    required this.deleted,
    required this.archived,
    required this.message,
  });

  factory StaffProductDeleteResult.fromJson(Map<String, dynamic> json) {
    return StaffProductDeleteResult(
      deleted: json['deleted'] == true,
      archived: json['archived'] == true,
      message: json['message']?.toString().trim() ?? '',
    );
  }

  final bool deleted;
  final bool archived;
  final String message;
}
