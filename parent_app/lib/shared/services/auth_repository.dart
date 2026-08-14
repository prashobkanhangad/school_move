import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../models/user_model.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<UserModel> login(String email, String password) async {
    try {
      final response = await _client.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = response.data['data'] as Map<String, dynamic>;
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      if (user.role != 'PARENT') {
        throw ApiException('Parent credentials required');
      }
      final tokens = data['tokens'] as Map<String, dynamic>;
      await _client.saveTokens(
        tokens['accessToken'] as String,
        tokens['refreshToken'] as String,
      );
      return await getMe();
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<UserModel> getMe() async {
    try {
      final response = await _client.dio.get('/auth/me');
      return UserModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _client.throwFromDio(e);
    }
  }

  Future<bool> hasSession() async {
    return await _client.getAccessToken() != null;
  }

  Future<void> logout() async {
    final refreshToken = await _client.getRefreshToken();
    if (refreshToken != null) {
      try {
        await _client.dio.post('/auth/logout', data: {'refreshToken': refreshToken});
      } catch (_) {
        // Still clear local session even if revoke fails.
      }
    }
    await _client.clearTokens();
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);
