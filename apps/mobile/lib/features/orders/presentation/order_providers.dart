import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/orders_repository.dart';
import '../domain/customer_order.dart';
import '../domain/order_details.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  return OrdersRepository(ref.watch(apiClientProvider));
});

final customerOrdersProvider =
    FutureProvider.autoDispose<List<CustomerOrder>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isAuthenticated) {
    return const <CustomerOrder>[];
  }

  return ref.watch(ordersRepositoryProvider).getMyOrders();
});

final orderDetailsProvider =
    FutureProvider.family<OrderDetails, String>((ref, orderNumber) {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isAuthenticated) {
    throw StateError('Sign in to view order details.');
  }
  return ref.watch(ordersRepositoryProvider).getOrderDetails(orderNumber);
});
