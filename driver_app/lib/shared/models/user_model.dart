class UserModel {
  UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.schoolId,
    this.phone,
    this.driverProfile,
    this.school,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String schoolId;
  final String? phone;
  final DriverProfileModel? driverProfile;
  final SchoolModel? school;

  String get fullName => '$firstName $lastName';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      role: json['role'] as String,
      schoolId: json['schoolId'] as String,
      phone: json['phone'] as String?,
      driverProfile: json['driverProfile'] != null
          ? DriverProfileModel.fromJson(json['driverProfile'] as Map<String, dynamic>)
          : null,
      school: json['school'] != null
          ? SchoolModel.fromJson(json['school'] as Map<String, dynamic>)
          : null,
    );
  }
}

class DriverProfileModel {
  DriverProfileModel({
    required this.id,
    required this.licenseNumber,
    required this.isAvailable,
  });

  final String id;
  final String licenseNumber;
  final bool isAvailable;

  factory DriverProfileModel.fromJson(Map<String, dynamic> json) {
    return DriverProfileModel(
      id: json['id'] as String,
      licenseNumber: json['licenseNumber'] as String,
      isAvailable: json['isAvailable'] as bool? ?? true,
    );
  }
}

class SchoolModel {
  SchoolModel({required this.id, required this.name, required this.code});

  final String id;
  final String name;
  final String code;

  factory SchoolModel.fromJson(Map<String, dynamic> json) {
    return SchoolModel(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String,
    );
  }
}

class LoginResult {
  LoginResult({required this.user, required this.accessToken, required this.refreshToken});

  final UserModel user;
  final String accessToken;
  final String refreshToken;
}
