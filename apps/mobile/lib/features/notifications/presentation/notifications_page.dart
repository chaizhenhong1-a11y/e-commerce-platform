import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/presentation/auth_providers.dart';
import 'notification_providers.dart';

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Updates')),
        body: Center(
          child: FilledButton(
            onPressed: () => context.push('/sign-in?returnTo=%2Fnotifications'),
            child: const Text('Sign in to view updates'),
          ),
        ),
      );
    }

    final feed = ref.watch(notificationFeedProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Updates'),
        actions: [
          feed.maybeWhen(
                data: (notificationFeed) => notificationFeed.unreadCount > 0
                    ? TextButton(
                        onPressed: () async {
                          await ref
                              .read(notificationsRepositoryProvider)
                              .markAllRead();
                          ref.invalidate(notificationFeedProvider);
                        },
                        child: const Text('Read all'),
                      )
                    : null,
                orElse: () => null,
              ) ??
              const SizedBox.shrink(),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(notificationFeedProvider);
          await ref.read(notificationFeedProvider.future);
        },
        child: feed.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => ListView(
            children: [
              const SizedBox(height: 120),
              Center(child: Text('Unable to load updates: $error')),
            ],
          ),
          data: (notificationFeed) {
            if (notificationFeed.items.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text('You’re all caught up.')),
                ],
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: notificationFeed.items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final notification = notificationFeed.items[index];
                return Card(
                  child: ListTile(
                    leading: Icon(
                      notification.isUnread
                          ? Icons.notifications_active_outlined
                          : Icons.notifications_none_rounded,
                    ),
                    title: Text(
                      notification.title,
                      style: TextStyle(
                        fontWeight: notification.isUnread
                            ? FontWeight.w800
                            : FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(
                      '${notification.message}\n${notification.createdAt.toLocal()}',
                    ),
                    isThreeLine: true,
                    onTap: () async {
                      if (notification.isUnread) {
                        await ref
                            .read(notificationsRepositoryProvider)
                            .markRead(notification.id);
                        ref.invalidate(notificationFeedProvider);
                      }

                      if (context.mounted && notification.orderNumber != null) {
                        context.push('/orders/${notification.orderNumber}');
                      }
                    },
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
