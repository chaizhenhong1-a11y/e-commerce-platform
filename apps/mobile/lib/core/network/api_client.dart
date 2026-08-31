import 'dart:async';

import 'package:dio/dio.dart';

import '../../features/auth/data/auth_storage.dart';
import '../../features/auth/domain/auth_session.dart';
import '../config/app_config.dart';

class ApiClient {
  ApiClient(this._authStorage)
      : dio = Dio(_baseOptions()),
        _refreshDio = Dio(_baseOptions()) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _onRequest,
        onError: _onError,
      ),
    );
  }

  final AuthStorage _authStorage;
  final Dio dio;
  final Dio _refreshDio;

  Future<AuthSession>? _refreshing;

  static BaseOptions _baseOptions() {
    return BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: const <String, String>{
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    );
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.extra['skipAuth'] == true) {
      handler.next(options);
      return;
    }

    final token = await _authStorage.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    final isUnauthorized = error.response?.statusCode == 401;
    final alreadyRetried = request.extra['authRetried'] == true;
    final skipRefresh = request.extra['skipRefresh'] == true;

    if (!isUnauthorized || alreadyRetried || skipRefresh) {
      handler.next(error);
      return;
    }

    try {
      final session = await _refreshSession();
      request.headers['Authorization'] = 'Bearer ${session.accessToken}';
      request.extra['authRetried'] = true;

      final response = await dio.fetch<dynamic>(request);
      handler.resolve(response);
    } catch (_) {
      await _authStorage.clear();
      handler.next(error);
    }
  }

  Future<AuthSession> _refreshSession() {
    final active = _refreshing;
    if (active != null) {
      return active;
    }

    final future = _performRefresh();
    _refreshing = future;
    future.whenComplete(() {
      _refreshing = null;
    });
    return future;
  }

  Future<AuthSession> _performRefresh() async {
    final refreshToken = await _authStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw StateError('No refresh token available.');
    }

    final response = await _refreshDio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: <String, dynamic>{'refreshToken': refreshToken},
    );

    final data = response.data;
    if (data == null) {
      throw StateError('Refresh response was empty.');
    }

    final session = AuthSession.fromJson(data);
    await _authStorage.saveTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    return session;
  }
}
