import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';

/// Tagged debug logging for the driver app. Filter logcat / Xcode console with `DriverApp`.
abstract final class AppLogger {
  static const _tag = 'DriverApp';

  static void info(String message, {String? tag}) {
    if (!kDebugMode) return;
    developer.log(message, name: tag ?? _tag);
  }

  static void error(String message, {Object? error, StackTrace? stackTrace, String? tag}) {
    if (!kDebugMode) return;
    developer.log(
      message,
      name: tag ?? _tag,
      error: error,
      stackTrace: stackTrace,
      level: 1000,
    );
  }
}
