import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/staff_repository.dart';
import '../domain/staff_commerce_summary.dart';

final staffRepositoryProvider = Provider<StaffRepository>((ref) {
  return StaffRepository(ref.watch(apiClientProvider));
});

final staffCommerceSummaryProvider =
    FutureProvider.autoDispose<StaffCommerceSummary>((ref) {
  return ref.watch(staffRepositoryProvider).getCommerceSummary();
});
