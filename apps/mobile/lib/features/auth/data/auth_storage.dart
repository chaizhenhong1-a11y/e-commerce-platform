import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'web_session_storage.dart';

class AuthStorage {
  AuthStorage(this._storage);

  static const _accessTokenKey = 'elvane_access_token';
  static const _refreshTokenKey = 'elvane_refresh_token';

  // Flutter Web keeps the development session in browser sessionStorage so
  // a full-page Stripe redirect can return to the same tab without losing the
  // authenticated session. Android/iOS continue to use platform secure storage.
  static String? _webAccessToken;
  static String? _webRefreshToken;

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() async {
    if (kIsWeb) {
      return readWebSessionValue(_accessTokenKey) ?? _webAccessToken;
    }
    return _storage.read(key: _accessTokenKey);
  }

  Future<String?> readRefreshToken() async {
    if (kIsWeb) {
      return readWebSessionValue(_refreshTokenKey) ?? _webRefreshToken;
    }
    return _storage.read(key: _refreshTokenKey);
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    if (kIsWeb) {
      _webAccessToken = accessToken;
      _webRefreshToken = refreshToken;
      writeWebSessionValue(_accessTokenKey, accessToken);
      writeWebSessionValue(_refreshTokenKey, refreshToken);
      return;
    }

    await Future.wait(<Future<void>>[
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<void> clear() async {
    if (kIsWeb) {
      _webAccessToken = null;
      _webRefreshToken = null;
      removeWebSessionValue(_accessTokenKey);
      removeWebSessionValue(_refreshTokenKey);
      return;
    }

    await Future.wait(<Future<void>>[
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }
}
