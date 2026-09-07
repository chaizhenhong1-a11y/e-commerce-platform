import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/staff_repository.dart';
import '../domain/staff_commerce_summary.dart';
import '../domain/staff_category.dart';
import '../domain/staff_promotion.dart';

final staffRepositoryProvider = Provider<StaffRepository>((ref) {
  return StaffRepository(ref.watch(apiClientProvider));
});

final staffCommerceSummaryProvider =
    FutureProvider.autoDispose<StaffCommerceSummary>((ref) {
  return ref.watch(staffRepositoryProvider).getCommerceSummary();
});

final staffCategoriesProvider =
    FutureProvider.autoDispose<List<StaffCategory>>((ref) {
  return ref.watch(staffRepositoryProvider).getCategories();
});

final staffCouponPromotionsProvider =
    FutureProvider.autoDispose<List<StaffCouponPromotion>>((ref) {
  return ref.watch(staffRepositoryProvider).getCouponPromotions();
});

final staffAutomaticPromotionsProvider =
    FutureProvider.autoDispose<List<StaffAutomaticPromotion>>((ref) {
  return ref.watch(staffRepositoryProvider).getAutomaticPromotions();
});

final staffPromotionEditorOptionsProvider =
    FutureProvider.autoDispose<StaffPromotionEditorOptions>((ref) {
  return ref.watch(staffRepositoryProvider).getPromotionEditorOptions();
});
