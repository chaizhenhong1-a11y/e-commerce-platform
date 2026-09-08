import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/staff_store_settings_repository.dart';
import '../domain/staff_store_settings.dart';

final staffStoreSettingsRepositoryProvider =
    Provider<StaffStoreSettingsRepository>((ref) {
  return StaffStoreSettingsRepository(ref.watch(apiClientProvider));
});

final staffStoreSettingsProvider =
    FutureProvider.autoDispose<StaffStoreSettings>((ref) {
  return ref.watch(staffStoreSettingsRepositoryProvider).get();
});
