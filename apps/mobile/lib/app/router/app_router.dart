import 'package:go_router/go_router.dart';
import '../../features/wishlist/presentation/wishlist_page.dart';

import '../../features/auth/presentation/forgot_password_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/account/presentation/address_book_page.dart';
import '../../features/auth/presentation/sign_in_page.dart';
import '../../features/cart/presentation/cart_page.dart';
import '../../features/checkout/presentation/checkout_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/orders/presentation/order_details_page.dart';
import '../../features/orders/presentation/orders_page.dart';
import '../../features/products/presentation/product_details_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../shell/main_shell.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: <RouteBase>[
    GoRoute(
      path: '/sign-in',
      builder: (context, state) => const SignInPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterPage(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordPage(),
    ),
    GoRoute(
      path: '/addresses',
      builder: (context, state) => const AddressBookPage(),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutPage(),
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
                  builder: (context, state) => const WishlistPage(),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/cart',
              builder: (context, state) => const CartPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/orders',
              builder: (context, state) => const OrdersPage(),
              routes: <RouteBase>[
                GoRoute(
                  path: ':orderNumber',
                  builder: (context, state) => OrderDetailsPage(
                    orderNumber: state.pathParameters['orderNumber']!,
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
              builder: (context, state) => const ProfilePage(),
            ),
          ],
        ),
      ],
    ),
  ],
);
