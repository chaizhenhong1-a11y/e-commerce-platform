import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/customer_repository.dart';
import '../domain/customer_address.dart';

final customerRepositoryProvider = Provider<CustomerRepository>((ref) {
  return CustomerRepository(ref.watch(apiClientProvider));
});

final customerAddressesProvider =
    FutureProvider.autoDispose<List<CustomerAddress>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isAuthenticated) {
    return const <CustomerAddress>[];
  }

  return ref.watch(customerRepositoryProvider).getAddresses();
});
