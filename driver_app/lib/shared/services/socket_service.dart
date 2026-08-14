import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../core/config/app_config.dart';
import '../../core/utils/app_logger.dart';
import '../models/trip_model.dart';
import '../../core/network/api_client.dart';
import 'auth_repository.dart';

class SocketService {
  SocketService(this._apiClient);

  final ApiClient _apiClient;
  io.Socket? _socket;
  final Set<String> _subscribedTrips = {};

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket?.connected == true) {
      AppLogger.info('Socket already connected');
      return;
    }

    final token = await _apiClient.getAccessToken();
    if (token == null) {
      AppLogger.info('Socket connect skipped (no access token)');
      return;
    }

    AppLogger.info('Socket connecting to ${AppConfig.socketUrl}');
    _socket?.dispose();
    final completer = Completer<void>();

    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .enableReconnection()
          .build(),
    );

    _socket!
      ..onConnect((_) {
        AppLogger.info('Socket connected');
        for (final tripId in _subscribedTrips) {
          _socket?.emit('subscribe:trip', {'tripId': tripId});
        }
        if (!completer.isCompleted) completer.complete();
      })
      ..onConnectError((e) {
        AppLogger.error('Socket connect error', error: e);
        if (!completer.isCompleted) {
          completer.completeError(e ?? 'Socket connect failed');
        }
      })
      ..onDisconnect((_) => AppLogger.info('Socket disconnected'))
      ..onError((e) => AppLogger.error('Socket error', error: e))
      ..connect();

    try {
      await completer.future.timeout(const Duration(seconds: 10));
    } catch (_) {
      // Keep socket for auto-reconnect; REST fallback remains available.
    }
  }

  void disconnect() {
    _subscribedTrips.clear();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  Future<void> subscribeTrip(String tripId) async {
    _subscribedTrips.add(tripId);
    if (!isConnected) {
      await connect();
    }
    if (isConnected) {
      _socket?.emit('subscribe:trip', {'tripId': tripId});
    }
  }

  void unsubscribeTrip(String tripId) {
    _subscribedTrips.remove(tripId);
    _socket?.emit('unsubscribe:trip', {'tripId': tripId});
  }

  Future<bool> sendLocation(LocationUpdate update, String tripId) async {
    if (_socket?.connected != true) return false;

    final completer = Completer<bool>();
    _socket!.emitWithAck(
      'location:update',
      update.toJson(tripId),
      ack: (data) {
        if (completer.isCompleted) return;
        if (data is Map && data['success'] == true) {
          completer.complete(true);
        } else {
          completer.complete(false);
        }
      },
    );

    try {
      return await completer.future.timeout(const Duration(seconds: 5));
    } on TimeoutException {
      return false;
    }
  }

  Future<void> sendLocationRest(LocationUpdate update, String tripId) async {
    await _apiClient.dio.post('/trips/$tripId/location', data: {
      'latitude': update.latitude,
      'longitude': update.longitude,
      if (update.heading != null) 'heading': update.heading,
      if (update.speed != null) 'speed': update.speed,
      if (update.accuracy != null) 'accuracy': update.accuracy,
      'recordedAt': update.recordedAt.toUtc().toIso8601String(),
    });
  }
}

final socketServiceProvider = Provider<SocketService>(
  (ref) => SocketService(ref.watch(apiClientProvider)),
);
