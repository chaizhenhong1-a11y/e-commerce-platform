import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart';
import '../data/auth_repository.dart';
import '../data/auth_storage.dart';
import '../domain/auth_state.dart';

final flutterSecureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
});

final authStorageProvider = Provider<AuthStorage>((ref) {
  return AuthStorage(ref.watch(flutterSecureStorageProvider));
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(authStorageProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiClient: ref.watch(apiClientProvider),
    storage: ref.watch(authStorageProvider),
  );
});

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.watch(authRepositoryProvider));
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(const AuthState.checking()) {
    _restore();
  }

  final AuthRepository _repository;

  Future<void> _restore() async {
    try {
      final user = await _repository.restoreSession();
      if (!mounted) {
        return;
      }
      state = AuthState(
        status: user == null
            ? AuthStatus.unauthenticated
            : AuthStatus.authenticated,
        user: user,
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isSubmitting: true, clearMessage: true);
    try {
      final session = await _repository.login(email: email, password: password);
      if (!mounted) {
        return false;
      }
      state = AuthState(
        status: AuthStatus.authenticated,
        user: session.user,
        message: 'Signed in successfully.',
      );
      return true;
    } on DioException catch (error) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isSubmitting: false,
        message: _messageFrom(error, 'Unable to sign in.'),
      );
      return false;
    } catch (_) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isSubmitting: false,
        message: 'Unable to sign in.',
      );
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    String? lastName,
  }) async {
    state = state.copyWith(isSubmitting: true, clearMessage: true);
    try {
      final session = await _repository.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      if (!mounted) {
        return false;
      }
      state = AuthState(
        status: AuthStatus.authenticated,
        user: session.user,
        message: 'Account created. Please verify your email.',
      );
      return true;
    } on DioException catch (error) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isSubmitting: false,
        message: _messageFrom(error, 'Unable to create account.'),
      );
      return false;
    } catch (_) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isSubmitting: false,
        message: 'Unable to create account.',
      );
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isSubmitting: true, clearMessage: true);
    try {
      await _repository.logout();
    } finally {
      if (mounted) {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    }
  }

  Future<void> resendVerification() async {
    state = state.copyWith(isSubmitting: true, clearMessage: true);
    try {
      await _repository.resendVerification();
      state = state.copyWith(
        isSubmitting: false,
        message: 'Verification email requested.',
      );
    } on DioException catch (error) {
      if (!mounted) {
        return;
      }
      state = state.copyWith(
        isSubmitting: false,
        message: _messageFrom(error, 'Unable to resend verification email.'),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      state = state.copyWith(
        isSubmitting: false,
        message: 'Unable to resend verification email.',
      );
    }
  }

  Future<void> refreshUser() async {
    if (!state.isAuthenticated) return;
    try {
      final user = await _repository.refreshCurrentUser();
      if (!mounted) {
        return;
      }
      state = state.copyWith(user: user, clearMessage: true);
    } on DioException {
      // The API client will clear invalid credentials when refresh fails.
    } catch (_) {
      // Keep the last known account state when a non-HTTP refresh fails.
    }
  }

  Future<String?> forgotPassword(String email) async {
    try {
      await _repository.forgotPassword(email);
      return null;
    } on DioException catch (error) {
      return _messageFrom(error, 'Unable to request password reset.');
    } catch (_) {
      return 'Unable to request password reset.';
    }
  }

  String _messageFrom(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
    }
    return fallback;
  }
}
