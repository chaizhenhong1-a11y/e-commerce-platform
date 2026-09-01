import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/cart_repository.dart';
import '../domain/customer_cart.dart';

final cartRepositoryProvider = Provider<CartRepository>((ref) {
  return CartRepository(ref.watch(apiClientProvider));
});

final customerCartProvider =
    FutureProvider.autoDispose<CustomerCart>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isAuthenticated) {
    return CustomerCart.empty();
  }
  return ref.watch(cartRepositoryProvider).getCart();
});
