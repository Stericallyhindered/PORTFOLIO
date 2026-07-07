enum UserType {
  customer,
  employee,
  admin,
}

class UserModel {
  String id;
  String email;
  String password; // In production, this should be hashed
  String firstName;
  String lastName;
  UserType userType;
  String? employeeId;
  List<String>? adminPermissions;
  String? profileImageUrl;
  DateTime createdAt;
  DateTime? lastLogin;
  bool isActive;
  Map<String, dynamic>? preferences;

  UserModel({
    required this.id,
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    required this.userType,
    this.employeeId,
    this.adminPermissions,
    this.profileImageUrl,
    required this.createdAt,
    this.lastLogin,
    this.isActive = true,
    this.preferences,
  });

  // JSON serialization
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'userType': userType.name,
      'employeeId': employeeId,
      'adminPermissions': adminPermissions,
      'profileImageUrl': profileImageUrl,
      'createdAt': createdAt.toIso8601String(),
      'lastLogin': lastLogin?.toIso8601String(),
      'isActive': isActive,
      'preferences': preferences,
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      password: json['password'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      userType: UserType.values.firstWhere(
        (type) => type.name == json['userType'],
        orElse: () => UserType.customer,
      ),
      employeeId: json['employeeId'],
      adminPermissions: json['adminPermissions']?.cast<String>(),
      profileImageUrl: json['profileImageUrl'],
      createdAt: DateTime.parse(json['createdAt']),
      lastLogin: json['lastLogin'] != null ? DateTime.parse(json['lastLogin']) : null,
      isActive: json['isActive'] ?? true,
      preferences: json['preferences'],
    );
  }

  // Copy with method
  UserModel copyWith({
    String? id,
    String? email,
    String? password,
    String? firstName,
    String? lastName,
    UserType? userType,
    String? employeeId,
    List<String>? adminPermissions,
    String? profileImageUrl,
    DateTime? createdAt,
    DateTime? lastLogin,
    bool? isActive,
    Map<String, dynamic>? preferences,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      password: password ?? this.password,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      userType: userType ?? this.userType,
      employeeId: employeeId ?? this.employeeId,
      adminPermissions: adminPermissions ?? this.adminPermissions,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      createdAt: createdAt ?? this.createdAt,
      lastLogin: lastLogin ?? this.lastLogin,
      isActive: isActive ?? this.isActive,
      preferences: preferences ?? this.preferences,
    );
  }

  // Helper methods
  bool get isAdmin => userType == UserType.admin;
  bool get isEmployee => userType == UserType.employee;
  bool get isCustomer => userType == UserType.customer;
  
  bool hasPermission(String permission) {
    if (!isAdmin) return false;
    return adminPermissions?.contains(permission) ?? false;
  }

  String get fullName => '$firstName $lastName';

  @override
  String toString() {
    return 'UserModel(id: $id, email: $email, name: $fullName, type: $userType)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UserModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}