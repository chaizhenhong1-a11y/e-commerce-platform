import 'auth_user.dart';

enum AuthStatus {
  checking,
  authenticated,
  unauthenticated,
}

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.isSubmitting = false,
    this.message,
  });

  const AuthState.checking()
      : status = AuthStatus.checking,
        user = null,
        isSubmitting = false,
        message = null;

  final AuthStatus status;
  final AuthUser? user;
  final bool isSubmitting;
  final String? message;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    bool clearUser = false,
    bool? isSubmitting,
    String? message,
    bool clearMessage = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      isSubmitting: isSubmitting ?? this.isSubmitting,
      message: clearMessage ? null : (message ?? this.message),
    );
  }
}
