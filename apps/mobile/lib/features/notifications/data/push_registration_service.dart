import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';

class PushRegistrationService {
  PushRegistrationService(this._apiClient);

  final ApiClient _apiClient;

  static const _enabled = bool.fromEnvironment(
    'PUSH_ENABLED',
    defaultValue: true,
  );

  String? _registeredToken;
  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<RemoteMessage>? _openedAppSubscription;
  bool _runtimeStarted = false;

  Future<void> startRuntime({
    required void Function(RemoteMessage message) onForegroundMessage,
    required void Function(String actionPath) onOpenAction,
  }) async {
    if (_runtimeStarted || !_enabled || kIsWeb) {
      return;
    }

    try {
      await _ensureFirebaseInitialized();
      final messaging = FirebaseMessaging.instance;

      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      _foregroundSubscription = FirebaseMessaging.onMessage.listen(
        onForegroundMessage,
      );
      _openedAppSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
        (message) => onOpenAction(actionPathFor(message)),
      );

      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        scheduleMicrotask(() => onOpenAction(actionPathFor(initialMessage)));
      }

      _runtimeStarted = true;
    } catch (_) {
      // Firebase native configuration may not be installed yet. Push remains
      // optional and must never block startup or commerce flows.
    }
  }

  Future<void> syncForSignedInAccount() async {
    if (!_enabled || kIsWeb) {
      return;
    }

    try {
      await _ensureFirebaseInitialized();
      final messaging = FirebaseMessaging.instance;
      final permission = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      if (permission.authorizationStatus == AuthorizationStatus.denied) {
        return;
      }

      final token = await messaging.getToken();
      if (token == null || token.isEmpty) {
        return;
      }

      await _register(token);
      _registeredToken = token;

      await _tokenRefreshSubscription?.cancel();
      _tokenRefreshSubscription = messaging.onTokenRefresh.listen(
        (newToken) async {
          try {
            await _register(newToken);
            _registeredToken = newToken;
          } catch (_) {
            // A token refresh must not interrupt an active customer session.
          }
        },
      );
    } catch (_) {
      // Push is optional and must never block authentication or shopping flows.
    }
  }

  Future<void> unregister() async {
    final token = _registeredToken;
    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;

    if (token == null) {
      return;
    }

    try {
      await _apiClient.dio.delete<void>(
        '/notifications/devices',
        data: <String, String>{'token': token},
      );
    } catch (_) {
      // Logout must complete even when the device deregistration request fails.
    }
    _registeredToken = null;
  }

  Future<void> dispose() async {
    await _tokenRefreshSubscription?.cancel();
    await _foregroundSubscription?.cancel();
    await _openedAppSubscription?.cancel();
  }

  String actionPathFor(RemoteMessage message) {
    final actionPath = message.data['actionPath']?.trim();
    if (actionPath != null && actionPath.startsWith('/')) {
      return actionPath;
    }

    final orderNumber = message.data['orderNumber']?.trim();
    if (orderNumber != null && orderNumber.isNotEmpty) {
      return '/orders/${Uri.encodeComponent(orderNumber)}';
    }

    return '/notifications';
  }

  Future<void> _register(String token) async {
    final platform = defaultTargetPlatform == TargetPlatform.iOS
        ? 'IOS'
        : 'ANDROID';
    await _apiClient.dio.post<void>(
      '/notifications/devices',
      data: <String, String>{
        'token': token,
        'platform': platform,
      },
    );
  }

  Future<void> _ensureFirebaseInitialized() async {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
  }
}
