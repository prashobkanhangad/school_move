class UserModel {
  UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.schoolId,
    this.school,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String schoolId;
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
      school: json['school'] != null
          ? SchoolModel.fromJson(json['school'] as Map<String, dynamic>)
          : null,
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
