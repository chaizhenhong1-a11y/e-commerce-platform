enum AuthUserRole {
  customer,
  staff,
  admin,
  unknown;

  factory AuthUserRole.fromApi(Object? value) {
    return switch (value?.toString().trim().toUpperCase()) {
      'CUSTOMER' => AuthUserRole.customer,
      'STAFF' => AuthUserRole.staff,
      'ADMIN' => AuthUserRole.admin,
      _ => AuthUserRole.unknown,
    };
  }

  bool get hasStaffAccess =>
      this == AuthUserRole.staff || this == AuthUserRole.admin;

  String get label {
    return switch (this) {
      AuthUserRole.customer => 'Customer',
      AuthUserRole.staff => 'Staff',
      AuthUserRole.admin => 'Admin',
      AuthUserRole.unknown => 'Account',
    };
  }
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.emailVerified,
    required this.role,
    this.lastName,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String?,
      emailVerified: json['emailVerified'] as bool? ?? false,
      role: AuthUserRole.fromApi(json['role']),
    );
  }

  final String id;
  final String email;
  final String firstName;
  final String? lastName;
  final bool emailVerified;
  final AuthUserRole role;

  bool get hasStaffAccess => role.hasStaffAccess;
  bool get isAdmin => role == AuthUserRole.admin;
  bool get isStaff => role == AuthUserRole.staff;

  String get displayName {
    final parts = <String>[
      firstName.trim(),
      if (lastName?.trim().isNotEmpty ?? false) lastName!.trim(),
    ];
    return parts.join(' ');
  }
}
