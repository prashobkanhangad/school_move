import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(),
        _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final original = error.requestOptions;
          if (error.response?.statusCode == 401 &&
              !original.path.contains('/auth/login') &&
              !original.path.contains('/auth/refresh') &&
              !original.path.contains('/auth/logout') &&
              original.extra['retried'] != true) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final token = await _storage.read(key: 'access_token');
              original.headers['Authorization'] = 'Bearer $token';
              original.extra['retried'] = true;
              try {
                final response = await _dio.fetch(original);
                return handler.resolve(response);
              } catch (e) {
                if (e is DioException) {
                  return handler.next(e);
                }
                return handler.next(error);
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final Dio _dio;
  final FlutterSecureStorage _storage;
  Future<bool>? _refreshInFlight;
  void Function()? onSessionExpired;

  Dio get dio => _dio;

  Future<bool> _tryRefresh() {
    return _refreshInFlight ??= _doRefresh().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  Future<bool> _doRefresh() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) {
      await _forceSessionExpired();
      return false;
    }
    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data['data'] as Map<String, dynamic>;
      await _storage.write(key: 'access_token', value: data['accessToken'] as String);
      await _storage.write(key: 'refresh_token', value: data['refreshToken'] as String);
      return true;
    } catch (_) {
      await _forceSessionExpired();
      return false;
    }
  }

  Future<void> _forceSessionExpired() async {
    await clearTokens();
    onSessionExpired?.call();
  }

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<String?> getAccessToken() => _storage.read(key: 'access_token');

  Future<String?> getRefreshToken() => _storage.read(key: 'refresh_token');

  Never throwFromDio(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['error'] is Map) {
      final err = data['error'] as Map;
      throw ApiException(
        err['message']?.toString() ?? 'Request failed',
        code: err['code']?.toString(),
        statusCode: e.response?.statusCode,
      );
    }
    throw ApiException(e.message ?? 'Network error', statusCode: e.response?.statusCode);
  }
}
