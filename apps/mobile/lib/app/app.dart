import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_theme.dart';
import '../features/auth/presentation/auth_providers.dart';
import '../features/notifications/presentation/notification_providers.dart';
import '../features/wishlist/presentation/wishlist_providers.dart';
import 'router/app_router.dart';

class TextShopApp extends ConsumerStatefulWidget {
  const TextShopApp({super.key});

  @override
  ConsumerState<TextShopApp> createState() => _TextShopAppState();
}

class _TextShopAppState extends ConsumerState<TextShopApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    final push = ref.read(pushRegistrationServiceProvider);
    unawaited(
      push.startRuntime(
        onForegroundMessage: _handleForegroundPush,
        onOpenAction: _openPushAction,
      ),
    );

    ref.listenManual(authControllerProvider, (previous, next) {
      if (next.isAuthenticated) {
        unawaited(push.syncForSignedInAccount());
      } else if (previous?.isAuthenticated == true) {
        unawaited(push.unregister());
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      ref.read(wishlistProductIdsProvider.notifier).refreshFromServer();
      if (ref.read(authControllerProvider).isAuthenticated) {
        unawaited(push.syncForSignedInAccount());
      }
    });
  }

  void _handleForegroundPush(RemoteMessage message) {
    ref.invalidate(notificationFeedProvider);

    final context = rootNavigatorKey.currentContext;
    if (context == null) {
      return;
    }

    final notification = message.notification;
    final title = notification?.title?.trim();
    final body = notification?.body?.trim();
    final fallback = body?.isNotEmpty == true
        ? body!
        : title?.isNotEmpty == true
            ? title!
            : 'You have a new TextShop update.';
    final actionPath = ref
        .read(pushRegistrationServiceProvider)
        .actionPathFor(message);

    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) {
      return;
    }

    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(fallback),
        action: SnackBarAction(
          label: 'View',
          onPressed: () => _openPushAction(actionPath),
        ),
      ),
    );
  }

  void _openPushAction(String actionPath) {
    ref.invalidate(notificationFeedProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      appRouter.go(actionPath);
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) {
      return;
    }

    ref.read(wishlistProductIdsProvider.notifier).refreshFromServer();
    ref.invalidate(notificationFeedProvider);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    unawaited(ref.read(pushRegistrationServiceProvider).dispose());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'TextShop',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: appRouter,
    );
  }
}
