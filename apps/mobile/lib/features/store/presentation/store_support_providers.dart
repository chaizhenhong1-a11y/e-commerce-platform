import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/store_info_repository.dart';
import '../domain/store_info.dart';

final storeInfoRepositoryProvider = Provider<StoreInfoRepository>((ref) {
  return StoreInfoRepository(ref.watch(apiClientProvider));
});

final storeInfoProvider = FutureProvider.autoDispose<StoreInfo>((ref) {
  return ref.watch(storeInfoRepositoryProvider).get();
});
