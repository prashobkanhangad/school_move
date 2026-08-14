import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../models/parent_models.dart';
import 'auth_repository.dart';

class SocketService {
  SocketService(this._client);

  final ApiClient _client;
  io.Socket? _socket;
  final Set<String> _subscribedTrips = {};

  void Function(BusLocationUpdate)? _onBusLocation;
  void Function(NotificationModel)? _onNotification;
  void Function(Map<String, dynamic>)? _onEmergency;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket?.connected == true) return;

    final token = await _client.getAccessToken();
    if (token == null) return;

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

    _bindHandlers();

    _socket!
      ..onConnect((_) {
        for (final tripId in _subscribedTrips) {
          _socket?.emit('subscribe:trip', {'tripId': tripId});
        }
        if (!completer.isCompleted) completer.complete();
      })
      ..onConnectError((error) {
        if (!completer.isCompleted) {
          completer.completeError(error ?? 'Socket connect failed');
        }
      })
      ..connect();

    try {
      await completer.future.timeout(const Duration(seconds: 10));
    } catch (_) {
      // Keep socket for auto-reconnect; callers can still proceed with REST.
    }
  }

  void _bindHandlers() {
    final socket = _socket;
    if (socket == null) return;

    socket.off('bus:location');
    socket.off('notification:event');
    socket.off('emergency:alert');

    socket.on('bus:location', (data) {
      final handler = _onBusLocation;
      if (handler == null || data is! Map) return;
      handler(BusLocationUpdate.fromJson(Map<String, dynamic>.from(data)));
    });

    socket.on('notification:event', (data) {
      final handler = _onNotification;
      if (handler == null || data is! Map) return;
      handler(NotificationModel.fromJson(Map<String, dynamic>.from(data)));
    });

    socket.on('emergency:alert', (data) {
      final handler = _onEmergency;
      if (handler == null || data is! Map) return;
      handler(Map<String, dynamic>.from(data));
    });
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

  void onBusLocation(void Function(BusLocationUpdate) handler) {
    _onBusLocation = handler;
    _bindHandlers();
  }

  void onNotification(void Function(NotificationModel) handler) {
    _onNotification = handler;
    _bindHandlers();
  }

  void onEmergency(void Function(Map<String, dynamic>) handler) {
    _onEmergency = handler;
    _bindHandlers();
  }

  void clearHandlers() {
    _onBusLocation = null;
    _onNotification = null;
    _onEmergency = null;
    _socket?.off('bus:location');
    _socket?.off('notification:event');
    _socket?.off('emergency:alert');
  }
}

final socketServiceProvider = Provider<SocketService>(
  (ref) => SocketService(ref.watch(apiClientProvider)),
);
