import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/app_logger.dart';
import '../models/user_model.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<LoginResult> login(String email, String password) async {
    try {
      AppLogger.info('AuthRepository.login → ${_client.dio.options.baseUrl}/auth/login');
      final response = await _client.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      AppLogger.info('AuthRepository.login ← status=${response.statusCode}');
      final data = response.data['data'] as Map<String, dynamic>;
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      final tokens = data['tokens'] as Map<String, dynamic>;

      if (user.role != 'DRIVER') {
        throw ApiException('Driver credentials required');
      }

      final accessToken = tokens['accessToken'] as String;
      final refreshToken = tokens['refreshToken'] as String;
      await _client.saveTokens(accessToken, refreshToken);

      return LoginResult(
        user: user,
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
    } on DioException catch (e) {
      AppLogger.error(
        'AuthRepository.login DioException type=${e.type} status=${e.response?.statusCode} message=${e.message}',
        error: e,
      );
      _client.throwFromDio(e);
    }
  }

  Future<UserModel> getMe() async {
    try {
      AppLogger.info('AuthRepository.getMe → ${_client.dio.options.baseUrl}/auth/me');
      final response = await _client.dio.get('/auth/me');
      AppLogger.info('AuthRepository.getMe ← status=${response.statusCode}');
      return UserModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      AppLogger.error(
        'AuthRepository.getMe DioException type=${e.type} status=${e.response?.statusCode}',
        error: e,
      );
      _client.throwFromDio(e);
    }
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

  Future<bool> hasSession() async {
    final token = await _client.getAccessToken();
    return token != null;
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);
