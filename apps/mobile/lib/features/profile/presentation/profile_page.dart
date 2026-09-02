import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/domain/auth_state.dart';
import '../../auth/presentation/auth_providers.dart';
import '../../cart/presentation/cart_providers.dart';
import '../../orders/presentation/order_providers.dart';
import '../../notifications/presentation/notification_providers.dart';
import '../../wishlist/presentation/wishlist_providers.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    if (auth.status == AuthStatus.checking) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!auth.isAuthenticated || auth.user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            const CircleAvatar(
              radius: 38,
              child: Icon(Icons.person_rounded, size: 38),
            ),
            const SizedBox(height: 18),
            Text(
              'Shop as a guest or sign in',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Sign in to keep orders, addresses, and account security synced.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () => context.push('/sign-in'),
              child: const Text('Sign in'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => context.push('/register'),
              child: const Text('Create account'),
            ),
          ],
        ),
      );
    }

    final user = auth.user!;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(authControllerProvider.notifier).refreshUser(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            CircleAvatar(
              radius: 38,
              child: Text(
                user.firstName.isEmpty ? '?' : user.firstName[0].toUpperCase(),
                style:
                    const TextStyle(fontSize: 30, fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user.displayName,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              user.email,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            if (!user.emailVerified)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Text(
                        'Verify your email',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Verification improves account recovery and future account communications.',
                      ),
                      const SizedBox(height: 14),
                      FilledButton.tonal(
                        onPressed: auth.isSubmitting
                            ? null
                            : () => ref
                                .read(authControllerProvider.notifier)
                                .resendVerification(),
                        child: const Text('Resend verification'),
                      ),
                    ],
                  ),
                ),
              ),
            if (auth.message != null) ...<Widget>[
              const SizedBox(height: 12),
              Text(auth.message!),
            ],
            const SizedBox(height: 20),
            Card(
              child: Column(
                children: <Widget>[
                  ListTile(
                    leading: const Icon(Icons.notifications_none_rounded),
                    title: const Text('Updates'),
                    subtitle: const Text('Order and delivery notifications'),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => context.push('/notifications'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.receipt_long_outlined),
                    title: const Text('My orders'),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => context.go('/orders'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.location_on_outlined),
                    title: const Text('Addresses'),
                    subtitle: const Text('Manage saved delivery addresses'),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => context.push('/addresses'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.logout_rounded),
                    title: const Text('Sign out'),
                    enabled: !auth.isSubmitting,
                    onTap: () async {
                      await ref.read(authControllerProvider.notifier).logout();
                      ref.invalidate(customerCartProvider);
                      ref.invalidate(wishlistProductIdsProvider);
                      ref.invalidate(customerOrdersProvider);
                      ref.invalidate(notificationFeedProvider);
                      if (context.mounted) context.go('/');
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
