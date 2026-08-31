import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_theme.dart';
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

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(wishlistProductIdsProvider.notifier).refreshFromServer();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;

    ref.read(wishlistProductIdsProvider.notifier).refreshFromServer();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
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
