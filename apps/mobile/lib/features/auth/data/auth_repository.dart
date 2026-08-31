import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/auth_session.dart';
import '../domain/auth_user.dart';
import 'auth_storage.dart';

class AuthRepository {
  AuthRepository({
    required ApiClient apiClient,
    required AuthStorage storage,
  })  : _apiClient = apiClient,
        _storage = storage;

  final ApiClient _apiClient;
  final AuthStorage _storage;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: <String, dynamic>{
        'email': email.trim(),
        'password': password,
      },
      options: Options(extra: <String, dynamic>{
        'skipAuth': true,
        'skipRefresh': true,
      }),
    );
    return _persistSession(response.data);
  }

  Future<AuthSession> register({
    required String email,
    required String password,
    required String firstName,
    String? lastName,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/auth/register',
      data: <String, dynamic>{
        'email': email.trim(),
        'password': password,
        'firstName': firstName.trim(),
        if (lastName?.trim().isNotEmpty ?? false) 'lastName': lastName!.trim(),
      },
      options: Options(extra: <String, dynamic>{
        'skipAuth': true,
        'skipRefresh': true,
      }),
    );
    return _persistSession(response.data);
  }

  Future<AuthUser?> restoreSession() async {
    final refreshToken = await _storage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return null;
    }

    try {
      final response =
          await _apiClient.dio.get<Map<String, dynamic>>('/auth/me');
      final data = response.data;
      return data == null ? null : AuthUser.fromJson(data);
    } on DioException {
      await _storage.clear();
      return null;
    }
  }

  Future<void> logout() async {
    final refreshToken = await _storage.readRefreshToken();
    try {
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _apiClient.dio.post<void>(
          '/auth/logout',
          data: <String, dynamic>{'refreshToken': refreshToken},
          options: Options(extra: <String, dynamic>{'skipRefresh': true}),
        );
      }
    } finally {
      await _storage.clear();
    }
  }

  Future<void> forgotPassword(String email) async {
    await _apiClient.dio.post<void>(
      '/auth/password/forgot',
      data: <String, dynamic>{'email': email.trim()},
      options: Options(extra: <String, dynamic>{
        'skipAuth': true,
        'skipRefresh': true,
      }),
    );
  }

  Future<void> resendVerification() async {
    await _apiClient.dio.post<void>('/auth/email/resend');
  }

  Future<AuthUser> refreshCurrentUser() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>('/auth/me');
    final data = response.data;
    if (data == null) {
      throw StateError('Account response was empty.');
    }
    return AuthUser.fromJson(data);
  }

  Future<AuthSession> _persistSession(Map<String, dynamic>? data) async {
    if (data == null) {
      throw StateError('Authentication response was empty.');
    }
    final session = AuthSession.fromJson(data);
    await _storage.saveTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    return session;
  }
}
