class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.emailVerified,
    this.lastName,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String?,
      emailVerified: json['emailVerified'] as bool? ?? false,
    );
  }

  final String id;
  final String email;
  final String firstName;
  final String? lastName;
  final bool emailVerified;

  String get displayName {
    final parts = <String>[
      firstName.trim(),
      if (lastName?.trim().isNotEmpty ?? false) lastName!.trim(),
    ];
    return parts.join(' ');
  }
}
