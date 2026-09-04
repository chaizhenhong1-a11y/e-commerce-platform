import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/domain/auth_state.dart';
import '../../account/presentation/address_book_providers.dart';
import '../../auth/presentation/auth_providers.dart';
import '../../cart/presentation/cart_providers.dart';
import '../../orders/presentation/order_providers.dart';
import '../../notifications/presentation/notification_providers.dart';
import '../../wishlist/presentation/wishlist_providers.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  static const Color _lime = Color(0xFFDBFF4B);
  static const Color _ink = Color(0xFF171717);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    if (auth.status == AuthStatus.checking) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!auth.isAuthenticated || auth.user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: _ink,
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 52,
                    height: 52,
                    decoration: const BoxDecoration(
                      color: _lime,
                      shape: BoxShape.circle,
                    ),
                    child:
                        const Icon(Icons.person_outline_rounded, color: _ink),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'YOUR TEXTSHOP\nSTARTS HERE.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      height: 1.02,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.8,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Sign in to keep your orders, saved addresses and account activity together.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.72),
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _ink,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(54),
              ),
              onPressed: () => context.push('/sign-in'),
              child: const Text('Sign in'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
              ),
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
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: _ink,
                borderRadius: BorderRadius.circular(28),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: <Widget>[
                  Container(
                    width: 68,
                    height: 68,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                        color: _lime, shape: BoxShape.circle),
                    child: Text(
                      user.firstName.isEmpty
                          ? '?'
                          : user.firstName[0].toUpperCase(),
                      style: const TextStyle(
                        color: _ink,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          user.displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.68)),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: <Widget>[
                            _StatusPill(
                              icon: user.emailVerified
                                  ? Icons.verified_outlined
                                  : Icons.mark_email_unread_outlined,
                              label: user.emailVerified
                                  ? 'Verified'
                                  : 'Verify email',
                              highlighted: user.emailVerified,
                            ),
                            if (user.hasStaffAccess)
                              _StatusPill(
                                icon: user.isAdmin
                                    ? Icons.admin_panel_settings_outlined
                                    : Icons.badge_outlined,
                                label: user.role.label,
                                highlighted: true,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (!user.emailVerified) ...<Widget>[
              const SizedBox(height: 16),
              _VerificationCard(
                submitting: auth.isSubmitting,
                onResend: () => ref
                    .read(authControllerProvider.notifier)
                    .resendVerification(),
              ),
            ],
            if (auth.message != null) ...<Widget>[
              const SizedBox(height: 12),
              Text(auth.message!),
            ],
            const SizedBox(height: 26),
            const _SectionHeading(
              eyebrow: 'SHOPPING',
              title: 'Your shortcuts',
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                Expanded(
                  child: _QuickAction(
                    icon: Icons.receipt_long_outlined,
                    label: 'Orders',
                    onTap: () => context.go('/orders'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.favorite_border_rounded,
                    label: 'Wishlist',
                    onTap: () => context.push('/wishlist'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.location_on_outlined,
                    label: 'Addresses',
                    onTap: () => context.push('/addresses'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.notifications_none_rounded,
                    label: 'Updates',
                    onTap: () => context.push('/notifications'),
                  ),
                ),
              ],
            ),
            if (user.hasStaffAccess) ...<Widget>[
              const SizedBox(height: 26),
              const _SectionHeading(
                  eyebrow: 'OPERATIONS', title: 'Staff access'),
              const SizedBox(height: 12),
              Material(
                color: _lime,
                borderRadius: BorderRadius.circular(22),
                child: InkWell(
                  borderRadius: BorderRadius.circular(22),
                  onTap: () => context.push('/staff'),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      children: <Widget>[
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: _ink,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            user.isAdmin
                                ? Icons.admin_panel_settings_outlined
                                : Icons.badge_outlined,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                'Staff Center',
                                style: TextStyle(
                                  color: _ink,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              SizedBox(height: 3),
                              Text(
                                'Commerce operations and fulfillment',
                                style: TextStyle(color: _ink, height: 1.3),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_rounded, color: _ink),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 26),
            const _SectionHeading(
                eyebrow: 'ACCOUNT', title: 'Account & activity'),
            const SizedBox(height: 12),
            _AccountPanel(
              children: <Widget>[
                _AccountTile(
                  icon: Icons.notifications_none_rounded,
                  title: 'Updates',
                  subtitle: 'Order and delivery notifications',
                  onTap: () => context.push('/notifications'),
                ),
                _AccountTile(
                  icon: Icons.receipt_long_outlined,
                  title: 'My orders',
                  subtitle: 'Purchases, delivery and returns',
                  onTap: () => context.go('/orders'),
                ),
                _AccountTile(
                  icon: Icons.location_on_outlined,
                  title: 'Addresses',
                  subtitle: 'Manage saved delivery addresses',
                  onTap: () => context.push('/addresses'),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Material(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: auth.isSubmitting
                    ? null
                    : () async {
                        await ref
                            .read(authControllerProvider.notifier)
                            .logout();
                        ref.invalidate(customerCartProvider);
                        ref.invalidate(customerAddressesProvider);
                        ref.invalidate(wishlistProductIdsProvider);
                        ref.invalidate(customerOrdersProvider);
                        ref.invalidate(notificationFeedProvider);
                        if (context.mounted) context.go('/');
                      },
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 18, vertical: 17),
                  child: Row(
                    children: <Widget>[
                      Icon(Icons.logout_rounded),
                      SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          'Sign out',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      Icon(Icons.arrow_forward_rounded, size: 20),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.icon,
    required this.label,
    required this.highlighted,
  });

  final IconData icon;
  final String label;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: highlighted
            ? ProfilePage._lime
            : Colors.white.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(
            icon,
            size: 15,
            color: highlighted ? ProfilePage._ink : Colors.white,
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: highlighted ? ProfilePage._ink : Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _VerificationCard extends StatelessWidget {
  const _VerificationCard({required this.submitting, required this.onResend});

  final bool submitting;
  final VoidCallback onResend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: ProfilePage._lime,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: <Widget>[
          const Icon(Icons.mark_email_unread_outlined, color: ProfilePage._ink),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Verify your email',
                  style: TextStyle(
                    color: ProfilePage._ink,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Keep account recovery and communications ready.',
                  style: TextStyle(color: ProfilePage._ink, height: 1.3),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: submitting ? null : onResend,
            child: const Text('Resend'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.eyebrow, required this.title});

  final String eyebrow;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          eyebrow,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.3,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
                letterSpacing: -0.4,
              ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction(
      {required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 16),
          child: Column(
            children: <Widget>[
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: ProfilePage._ink,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: ProfilePage._lime, size: 21),
              ),
              const SizedBox(height: 9),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style:
                    const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccountPanel extends StatelessWidget {
  const _AccountPanel({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        children: <Widget>[
          for (var i = 0; i < children.length; i++) ...<Widget>[
            children[i],
            if (i != children.length - 1)
              const Divider(height: 1, indent: 66, endIndent: 16),
          ],
        ],
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  const _AccountTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: ProfilePage._lime,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: ProfilePage._ink, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: onTap,
    );
  }
}
