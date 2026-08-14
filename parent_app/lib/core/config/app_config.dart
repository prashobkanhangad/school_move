import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

class AppConfig {
  AppConfig._();

  static const String _apiBaseUrlEnv = String.fromEnvironment('API_BASE_URL');
  static const String _socketUrlEnv = String.fromEnvironment('SOCKET_URL');

  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  /// Android emulator loopback to host machine; iOS simulator uses localhost.
  static String get apiBaseUrl {
    if (_apiBaseUrlEnv.isNotEmpty) return _apiBaseUrlEnv;
    if (kReleaseMode) {
      throw StateError(
        'Release builds require --dart-define=API_BASE_URL=https://your-api.example.com/api/v1',
      );
    }
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:5001/api/v1';
    }
    return 'http://localhost:5001/api/v1';
  }

  static String get socketUrl {
    if (_socketUrlEnv.isNotEmpty) return _socketUrlEnv;
    if (kReleaseMode) {
      throw StateError(
        'Release builds require --dart-define=SOCKET_URL=https://your-api.example.com',
      );
    }
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:5001';
    }
    return 'http://localhost:5001';
  }
}
