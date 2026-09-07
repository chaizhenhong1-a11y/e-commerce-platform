import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/foundation.dart';

import '../../features/account/presentation/address_book_page.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/presentation/auth_providers.dart';
import '../../features/auth/presentation/forgot_password_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/auth/presentation/sign_in_page.dart';
import '../../features/cart/presentation/cart_page.dart';
import '../../features/checkout/presentation/checkout_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/notifications/presentation/notifications_page.dart';
import '../../features/orders/presentation/order_details_page.dart';
import '../../features/orders/presentation/orders_page.dart';
import '../../features/products/presentation/product_details_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/staff/presentation/staff_center_page.dart';
import '../../features/staff/presentation/staff_categories_page.dart';
import '../../features/staff/presentation/staff_orders_page.dart';
import '../../features/staff/presentation/staff_returns_page.dart';
import '../../features/staff/presentation/staff_catalog_page.dart';
import '../../features/staff/presentation/staff_product_editor_page.dart';
import '../../features/staff/presentation/staff_promotions_page.dart';
import '../../features/wishlist/presentation/wishlist_page.dart';
import '../shell/main_shell.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

String _signInLocation(String returnTo) {
  return Uri(
    path: '/sign-in',
    queryParameters: <String, String>{'returnTo': returnTo},
  ).toString();
}

class _AuthRequiredRoute extends ConsumerWidget {
  const _AuthRequiredRoute({
    required this.returnTo,
    required this.child,
  });

  final String returnTo;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    if (auth.status == AuthStatus.checking) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!auth.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!context.mounted) {
          return;
        }
        context.go(_signInLocation(returnTo));
      });
      return const SizedBox.shrink();
    }

    return child;
  }
}

class _StaffRequiredRoute extends ConsumerWidget {
  const _StaffRequiredRoute({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    if (auth.status == AuthStatus.checking) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!auth.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          context.go(_signInLocation('/staff'));
        }
      });
      return const SizedBox.shrink();
    }

    if (!(auth.user?.hasStaffAccess ?? false)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          context.go('/profile');
        }
      });
      return const SizedBox.shrink();
    }

    return child;
  }
}

String _initialLocation() {
  if (!kIsWeb) {
    return '/';
  }

  final uri = Uri.base;
  final path = uri.path.isEmpty ? '/' : uri.path;

  return uri.hasQuery ? '$path?${uri.query}' : path;
}


final GoRouter appRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: _initialLocation(),
  overridePlatformDefaultLocation: true,
  routes: <RouteBase>[
    GoRoute(
      path: '/sign-in',
      builder: (context, state) => SignInPage(
        returnTo: state.uri.queryParameters['returnTo'],
      ),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => RegisterPage(
        returnTo: state.uri.queryParameters['returnTo'],
      ),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordPage(),
    ),
    GoRoute(
      path: '/addresses',
      builder: (context, state) => _AuthRequiredRoute(
        returnTo: state.uri.toString(),
        child: const AddressBookPage(),
      ),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => _AuthRequiredRoute(
        returnTo: state.uri.toString(),
        child: const NotificationsPage(),
      ),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => _AuthRequiredRoute(
        returnTo: state.uri.toString(),
        child: const CheckoutPage(),
      ),
    ),
    GoRoute(
      path: '/staff',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffCenterPage(),
      ),
    ),
    GoRoute(
      path: '/staff/orders',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffOrdersPage(),
      ),
    ),
    GoRoute(
      path: '/staff/returns',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffReturnsPage(),
      ),
    ),
    GoRoute(
      path: '/staff/categories',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffCategoriesPage(),
      ),
    ),
    GoRoute(
      path: '/staff/promotions',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffPromotionsPage(),
      ),
    ),
    GoRoute(
      path: '/staff/promotions/automatic',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffPromotionsPage(
          initialSection: StaffPromotionsSection.automatic,
        ),
      ),
    ),
    GoRoute(
      path: '/staff/catalog',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffCatalogPage(),
      ),
    ),
    GoRoute(
      path: '/staff/catalog/new',
      builder: (context, state) => const _StaffRequiredRoute(
        child: StaffProductEditorPage(),
      ),
    ),
    GoRoute(
      path: '/staff/catalog/products/:productId',
      builder: (context, state) => _StaffRequiredRoute(
        child: StaffProductEditorPage(
          productId: state.pathParameters['productId'],
        ),
      ),
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) => MainShell(
        navigationShell: navigationShell,
      ),
      branches: <StatefulShellBranch>[
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/',
              builder: (context, state) => const HomePage(),
              routes: <RouteBase>[
                GoRoute(
                  path: 'products/:productId',
                  builder: (context, state) => ProductDetailsPage(
                    productId: state.pathParameters['productId']!,
                  ),
                ),
                GoRoute(
                  path: 'wishlist',
                  builder: (context, state) => _AuthRequiredRoute(
                    returnTo: state.uri.toString(),
                    child: const WishlistPage(),
                  ),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/cart',
              builder: (context, state) => _AuthRequiredRoute(
                returnTo: state.uri.toString(),
                child: const CartPage(),
              ),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/orders',
              builder: (context, state) => _AuthRequiredRoute(
                returnTo: state.uri.toString(),
                child: const OrdersPage(),
              ),
              routes: <RouteBase>[
                GoRoute(
                  path: ':orderNumber',
                  builder: (context, state) => _AuthRequiredRoute(
                    returnTo: state.uri.toString(),
                    child: OrderDetailsPage(
                      orderNumber: state.pathParameters['orderNumber']!,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/profile',
              builder: (context, state) => _AuthRequiredRoute(
                returnTo: state.uri.toString(),
                child: const ProfilePage(),
              ),
            ),
          ],
        ),
      ],
    ),
  ],
);
