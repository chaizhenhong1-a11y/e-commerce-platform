import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/auth_providers.dart';
import '../data/wishlist_repository.dart';

final wishlistRepositoryProvider = Provider<WishlistRepository>((ref) {
  return ApiWishlistRepository(ref.watch(apiClientProvider));
});

final wishlistProductIdsProvider =
    AsyncNotifierProvider<WishlistController, Set<String>>(
        WishlistController.new);

final wishlistCountProvider = Provider<int>((ref) {
  return ref.watch(wishlistProductIdsProvider).valueOrNull?.length ?? 0;
});

class WishlistController extends AsyncNotifier<Set<String>> {
  WishlistRepository get _repository => ref.read(wishlistRepositoryProvider);

  @override
  Future<Set<String>> build() async {
    final authState = ref.watch(authControllerProvider);
    if (!authState.isAuthenticated) return <String>{};
    return _repository.getProductIds();
  }

  Future<void> refreshFromServer() async {
    if (!ref.read(authControllerProvider).isAuthenticated) {
      state = const AsyncData(<String>{});
      return;
    }

    final current = state.valueOrNull;
    try {
      final productIds = await _repository.getProductIds();
      state = AsyncData(productIds);
    } catch (error, stackTrace) {
      if (current != null) {
        state = AsyncData(current);
      } else {
        state = AsyncError(error, stackTrace);
      }
    }
  }

  Future<void> toggle(String productId) async {
    if (!ref.read(authControllerProvider).isAuthenticated) {
      throw StateError('Sign in to save products.');
    }
    final current = state.valueOrNull ?? <String>{};
    final wasSaved = current.contains(productId);
    final optimistic = Set<String>.from(current);
    wasSaved ? optimistic.remove(productId) : optimistic.add(productId);
    state = AsyncData(optimistic);
    try {
      if (wasSaved) {
        await _repository.remove(productId);
      } else {
        await _repository.add(productId);
      }
    } catch (error, stackTrace) {
      state = AsyncData(current);
      Error.throwWithStackTrace(error, stackTrace);
    }
  }
}
