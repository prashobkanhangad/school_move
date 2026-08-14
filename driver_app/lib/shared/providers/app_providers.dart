import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/app_logger.dart';
import '../models/route_model.dart';
import '../models/trip_model.dart';
import '../models/user_model.dart';
import '../services/auth_repository.dart';
import '../services/location_service.dart';
import '../services/socket_service.dart';
import '../services/trip_repository.dart';

class AuthState {
  const AuthState({this.user, this.isLoading = false, this.isAuthenticated = false});

  final UserModel? user;
  final bool isLoading;
  final bool isAuthenticated;

  AuthState copyWith({UserModel? user, bool? isLoading, bool? isAuthenticated}) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._authRepo, this._socket, this._client) : super(const AuthState()) {
    _client.onSessionExpired = _onSessionExpired;
    _bootstrap();
  }

  final AuthRepository _authRepo;
  final SocketService _socket;
  final ApiClient _client;

  void _onSessionExpired() {
    _socket.disconnect();
    state = const AuthState();
  }

  Future<void> _bootstrap() async {
    AppLogger.info('Auth bootstrap started');
    state = state.copyWith(isLoading: true);
    try {
      final hasSession = await _authRepo.hasSession();
      AppLogger.info('Auth bootstrap hasSession=$hasSession');
      if (!hasSession) {
        state = const AuthState(isLoading: false);
        return;
      }
      final user = await _authRepo.getMe();
      if (user.role != 'DRIVER') {
        await _authRepo.logout();
        state = const AuthState(isLoading: false);
        return;
      }
      await _socket.connect();
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
      AppLogger.info('Auth bootstrap done (restored session)');
    } catch (e, st) {
      AppLogger.error('Auth bootstrap failed', error: e, stackTrace: st);
      await _authRepo.logout();
      state = const AuthState(isLoading: false);
    }
  }

  Future<void> login(String email, String password) async {
    AppLogger.info('Login started email=$email api=${AppConfig.apiBaseUrl}');
    state = state.copyWith(isLoading: true);
    try {
      await _authRepo.login(email, password);
      final user = await _authRepo.getMe();
      await _socket.connect();
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
      AppLogger.info('Login success userId=${user.id} role=${user.role}');
    } catch (e, st) {
      AppLogger.error('Login failed', error: e, stackTrace: st);
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    _socket.disconnect();
    await _authRepo.logout();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(socketServiceProvider),
    client,
  );
});

class TripState {
  const TripState({
    this.activeTrip,
    this.isLoading = false,
    this.isTracking = false,
    this.lastPosition,
    this.lastSentAt,
    this.lastSkipReason,
    this.error,
    this.availableRoutes = const [],
    this.assignedBus,
  });

  final TripModel? activeTrip;
  final bool isLoading;
  final bool isTracking;
  final Position? lastPosition;
  final DateTime? lastSentAt;
  final String? lastSkipReason;
  final String? error;
  final List<RouteModel> availableRoutes;
  final BusModel? assignedBus;

  TripState copyWith({
    TripModel? activeTrip,
    bool? isLoading,
    bool? isTracking,
    Position? lastPosition,
    DateTime? lastSentAt,
    String? lastSkipReason,
    String? error,
    List<RouteModel>? availableRoutes,
    BusModel? assignedBus,
    bool clearTrip = false,
    bool clearBus = false,
    bool clearSkipReason = false,
  }) {
    return TripState(
      activeTrip: clearTrip ? null : (activeTrip ?? this.activeTrip),
      isLoading: isLoading ?? this.isLoading,
      isTracking: isTracking ?? this.isTracking,
      lastPosition: lastPosition ?? this.lastPosition,
      lastSentAt: lastSentAt ?? this.lastSentAt,
      lastSkipReason: clearSkipReason ? null : (lastSkipReason ?? this.lastSkipReason),
      error: error,
      availableRoutes: availableRoutes ?? this.availableRoutes,
      assignedBus: clearBus ? null : (assignedBus ?? this.assignedBus),
    );
  }
}

class TripNotifier extends StateNotifier<TripState> {
  TripNotifier(
    this._tripRepo,
    this._locationService,
    this._socket,
    this._driverProfileId,
  ) : super(const TripState());

  final TripRepository _tripRepo;
  final LocationService _locationService;
  final SocketService _socket;
  final String? _driverProfileId;

  StreamSubscription<Position>? _positionSub;
  Timer? _gpsTimer;
  bool _publishInFlight = false;
  String? _trackingTripId;

  void _setState(TripState newState) {
    if (!mounted) return;
    state = newState;
  }

  void reset() {
    _cancelTrackingListeners();
    _trackingTripId = null;
    _publishInFlight = false;
    if (mounted) state = const TripState();
  }

  Future<void> onAuthenticated() async {
    await refresh();
  }

  void _cancelTrackingListeners() {
    _positionSub?.cancel();
    _positionSub = null;
    _gpsTimer?.cancel();
    _gpsTimer = null;
  }

  Future<void> refresh() async {
    if (!mounted) return;
    _setState(state.copyWith(isLoading: true, error: null));
    try {
      final trip = await _tripRepo.getActiveTrip();
      if (!mounted) return;

      if (trip != null && trip.isActive) {
        _setState(state.copyWith(activeTrip: trip, isLoading: false));
        await _startTracking(trip);
        return;
      }

      final buses = await _tripRepo.getBuses();
      if (!mounted) return;

      BusModel? assigned;
      if (_driverProfileId != null) {
        for (final bus in buses) {
          if (bus.driverId == _driverProfileId) {
            assigned = bus;
            break;
          }
        }
      }

      final routes = assigned != null
          ? await _tripRepo.getRoutes(busId: assigned.id)
          : <RouteModel>[];
      if (!mounted) return;

      _setState(TripState(
        isLoading: false,
        assignedBus: assigned,
        availableRoutes: routes,
      ));
    } catch (e) {
      if (!mounted) return;
      _setState(state.copyWith(isLoading: false, error: e.toString()));
    }
  }

  Future<void> startTrip(String routeId, String busId) async {
    if (!mounted) return;
    if (state.activeTrip?.isActive == true) {
      throw Exception('A trip is already active');
    }

    _setState(state.copyWith(isLoading: true, error: null));
    try {
      final granted = await _locationService.ensurePermission();
      if (!mounted) return;
      if (!granted) {
        throw Exception('Location permission is required to start a trip');
      }

      var trip = await _tripRepo.startTrip(routeId: routeId, busId: busId);
      if (!mounted) return;

      // Prefer active-trip payload (includes route stops).
      final detailed = await _tripRepo.getActiveTrip();
      if (!mounted) return;
      if (detailed != null) trip = detailed;

      _setState(state.copyWith(activeTrip: trip, isLoading: false));
      await _startTracking(trip);
    } catch (e) {
      if (!mounted) return;
      _setState(state.copyWith(isLoading: false, error: e.toString()));
      rethrow;
    }
  }

  Future<void> endTrip() async {
    if (!mounted) return;
    final trip = state.activeTrip;
    if (trip == null) return;

    _setState(state.copyWith(isLoading: true, error: null));
    try {
      await _tripRepo.endTrip(trip.id);
      if (!mounted) return;
      await _stopTracking();
      if (!mounted) return;
      _socket.unsubscribeTrip(trip.id);
      _setState(const TripState());
      await refresh();
    } catch (e) {
      if (!mounted) return;
      // Keep GPS sharing if end failed — trip is still ACTIVE on server.
      _setState(state.copyWith(isLoading: false, error: e.toString()));
      rethrow;
    }
  }

  Future<void> sendEmergency({String? message}) async {
    if (!mounted) return;
    final trip = state.activeTrip;
    if (trip == null) return;

    final position = state.lastPosition ??
        await _locationService.getCurrentPosition().timeout(
              const Duration(seconds: 10),
              onTimeout: () => null,
            );
    if (!mounted) return;
    if (position == null) {
      throw Exception('Unable to get current location for emergency');
    }

    await _tripRepo.sendEmergency(
      tripId: trip.id,
      latitude: position.latitude,
      longitude: position.longitude,
      message: message,
    );
  }

  Future<void> _startTracking(TripModel trip) async {
    if (!mounted) return;
    _trackingTripId = trip.id;
    await _socket.connect();
    if (!mounted) return;
    await _socket.subscribeTrip(trip.id);

    _cancelTrackingListeners();
    if (!mounted) return;
    _setState(state.copyWith(isTracking: true, clearSkipReason: true));

    _attachPositionStream(trip.id);

    _gpsTimer = Timer.periodic(
      const Duration(seconds: AppConfig.gpsIntervalSeconds),
      (_) async {
        if (!mounted || _trackingTripId != trip.id) return;
        // Always fetch a fresh reading — never reuse a stale lastPosition alone.
        final pos = await _locationService.getCurrentPosition();
        if (!mounted || _trackingTripId != trip.id) return;
        if (pos != null) {
          _setState(state.copyWith(lastPosition: pos));
          await _publishLocation(trip.id, pos);
        }
      },
    );
  }

  void _attachPositionStream(String tripId) {
    _positionSub?.cancel();
    _positionSub = _locationService.positionStream().listen(
      (position) async {
        if (!mounted || _trackingTripId != tripId) return;
        _setState(state.copyWith(lastPosition: position));
        await _publishLocation(tripId, position);
      },
      onError: (error, stack) {
        AppLogger.error('GPS stream error', error: error, stackTrace: stack);
        if (!mounted || _trackingTripId != tripId) return;
        // Restart stream after a brief delay.
        Future<void>.delayed(const Duration(seconds: 2), () {
          if (!mounted || _trackingTripId != tripId) return;
          _attachPositionStream(tripId);
        });
      },
      onDone: () {
        if (!mounted || _trackingTripId != tripId) return;
        Future<void>.delayed(const Duration(seconds: 2), () {
          if (!mounted || _trackingTripId != tripId) return;
          _attachPositionStream(tripId);
        });
      },
      cancelOnError: false,
    );
  }

  Future<void> _publishLocation(String tripId, Position position) async {
    if (!mounted || _publishInFlight) return;
    if (position.accuracy > AppConfig.maxAccuracyMeters) {
      _setState(state.copyWith(
        lastSkipReason: 'GPS accuracy too low (${position.accuracy.toStringAsFixed(0)} m)',
      ));
      return;
    }

    _publishInFlight = true;
    try {
      final update = LocationUpdate(
        latitude: position.latitude,
        longitude: position.longitude,
        heading: position.heading.isNaN ? null : position.heading,
        // Geolocator reports m/s — keep that unit for the API.
        speed: position.speed.isNaN ? null : position.speed,
        accuracy: position.accuracy,
        recordedAt: DateTime.now(),
      );

      var sent = await _socket.sendLocation(update, tripId);
      if (!mounted) return;
      if (!sent) {
        try {
          await _socket.sendLocationRest(update, tripId);
          sent = true;
        } catch (_) {
          sent = false;
        }
      }

      if (!mounted) return;
      if (sent) {
        _setState(state.copyWith(lastSentAt: DateTime.now(), clearSkipReason: true));
      } else {
        _setState(state.copyWith(lastSkipReason: 'Failed to send location'));
      }
    } finally {
      _publishInFlight = false;
    }
  }

  Future<void> _stopTracking() async {
    _trackingTripId = null;
    _cancelTrackingListeners();
    if (!mounted) return;
    _setState(state.copyWith(isTracking: false));
  }

  @override
  void dispose() {
    _cancelTrackingListeners();
    super.dispose();
  }
}

final tripProvider = StateNotifierProvider<TripNotifier, TripState>((ref) {
  final driverProfileId = ref.watch(
    authProvider.select((s) => s.user?.driverProfile?.id),
  );
  final notifier = TripNotifier(
    ref.watch(tripRepositoryProvider),
    LocationService(),
    ref.watch(socketServiceProvider),
    driverProfileId,
  );

  ref.listen<AuthState>(authProvider, (prev, next) {
    if (next.isAuthenticated && prev?.isAuthenticated != true) {
      notifier.onAuthenticated();
    } else if (!next.isAuthenticated && prev?.isAuthenticated == true) {
      notifier.reset();
    } else if (next.isAuthenticated && prev == null) {
      notifier.onAuthenticated();
    }
  }, fireImmediately: true);

  return notifier;
});
