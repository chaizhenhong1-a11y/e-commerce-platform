import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  AuthStorage(this._storage);

  static const _accessTokenKey = 'textshop_access_token';
  static const _refreshTokenKey = 'textshop_refresh_token';

  // Flutter Web is only a development/test target for the mobile client.
  // Keep browser credentials in memory instead of relying on the plugin's
  // experimental WebCrypto implementation. Android/iOS continue to use
  // platform secure storage.
  static String? _webAccessToken;
  static String? _webRefreshToken;

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() async {
    if (kIsWeb) {
      return _webAccessToken;
    }
    return _storage.read(key: _accessTokenKey);
  }

  Future<String?> readRefreshToken() async {
    if (kIsWeb) {
      return _webRefreshToken;
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
      return;
    }

    await Future.wait(<Future<void>>[
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }
}
