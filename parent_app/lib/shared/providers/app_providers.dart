import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../models/parent_models.dart';
import '../models/user_model.dart';
import '../services/auth_repository.dart';
import '../services/parent_repository.dart';
import '../services/socket_service.dart';

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
  });

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
  void Function()? onLoggedOut;

  void _onSessionExpired() {
    _socket.disconnect();
    state = const AuthState();
    onLoggedOut?.call();
  }

  Future<void> _bootstrap() async {
    state = state.copyWith(isLoading: true);
    try {
      if (!await _authRepo.hasSession()) {
        state = const AuthState(isLoading: false);
        return;
      }
      final user = await _authRepo.getMe();
      if (user.role != 'PARENT') {
        await _authRepo.logout();
        state = const AuthState(isLoading: false);
        return;
      }
      await _socket.connect();
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
    } catch (_) {
      await _authRepo.logout();
      state = const AuthState(isLoading: false);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      final user = await _authRepo.login(email, password);
      await _socket.connect();
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    _socket.disconnect();
    await _authRepo.logout();
    state = const AuthState();
    onLoggedOut?.call();
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

class ChildrenState {
  const ChildrenState({
    this.children = const [],
    this.isLoading = false,
    this.error,
    this.emergencyAlert,
    this.latestNotification,
  });

  final List<ChildModel> children;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? emergencyAlert;
  final NotificationModel? latestNotification;

  ChildrenState copyWith({
    List<ChildModel>? children,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? emergencyAlert,
    NotificationModel? latestNotification,
    bool clearEmergency = false,
    bool clearNotification = false,
    bool clearError = false,
  }) {
    return ChildrenState(
      children: children ?? this.children,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      emergencyAlert: clearEmergency ? null : (emergencyAlert ?? this.emergencyAlert),
      latestNotification:
          clearNotification ? null : (latestNotification ?? this.latestNotification),
    );
  }
}

class ChildrenNotifier extends StateNotifier<ChildrenState> {
  ChildrenNotifier(this._parentRepo, this._socket) : super(const ChildrenState()) {
    _setupSocketListeners();
  }

  final ParentRepository _parentRepo;
  final SocketService _socket;

  void _setupSocketListeners() {
    _socket.onBusLocation((update) {
      final updated = state.children.map((child) {
        if (child.activeTrip?.id == update.tripId) {
          return child.copyWith(
            activeTrip: child.activeTrip!.copyWith(
              currentLat: update.latitude,
              currentLng: update.longitude,
              lastLocationAt: update.recordedAt ?? DateTime.now(),
            ),
          );
        }
        return child;
      }).toList();
      state = state.copyWith(children: updated);
    });

    _socket.onNotification((notification) {
      if (notification.type == 'EMERGENCY') {
        state = state.copyWith(
          latestNotification: notification,
          emergencyAlert: {
            'message': notification.body,
            'title': notification.title,
            'notificationId': notification.id,
          },
        );
      } else {
        state = state.copyWith(latestNotification: notification);
      }
    });

    _socket.onEmergency((alert) {
      state = state.copyWith(emergencyAlert: alert);
    });
  }

  Future<void> onAuthenticated() async {
    await refresh();
  }

  void reset() {
    state = const ChildrenState();
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _socket.connect();
      final children = await _parentRepo.getMyChildren();

      for (final child in children) {
        if (child.activeTrip?.isActive == true) {
          await _socket.subscribeTrip(child.activeTrip!.id);
        }
      }

      state = state.copyWith(
        children: children,
        isLoading: false,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void clearEmergency() {
    state = state.copyWith(clearEmergency: true);
  }

  void clearLatestNotification() {
    state = state.copyWith(clearNotification: true);
  }
}

final childrenProvider = StateNotifierProvider<ChildrenNotifier, ChildrenState>((ref) {
  final notifier = ChildrenNotifier(
    ref.watch(parentRepositoryProvider),
    ref.watch(socketServiceProvider),
  );

  ref.listen<AuthState>(authProvider, (prev, next) {
    if (next.isAuthenticated && prev?.isAuthenticated != true) {
      notifier.onAuthenticated();
    } else if (!next.isAuthenticated && prev?.isAuthenticated == true) {
      notifier.reset();
    } else if (next.isAuthenticated && prev == null) {
      // fireImmediately first frame when already authenticated after bootstrap
      notifier.onAuthenticated();
    }
  }, fireImmediately: true);

  return notifier;
});

class TrackingState {
  const TrackingState({
    this.eta,
    this.isLoadingEta = false,
    this.etaError,
  });

  final EtaModel? eta;
  final bool isLoadingEta;
  final String? etaError;

  TrackingState copyWith({EtaModel? eta, bool? isLoadingEta, String? etaError}) {
    return TrackingState(
      eta: eta ?? this.eta,
      isLoadingEta: isLoadingEta ?? this.isLoadingEta,
      etaError: etaError,
    );
  }
}

class TrackingNotifier extends StateNotifier<TrackingState> {
  TrackingNotifier(this._parentRepo) : super(const TrackingState());

  final ParentRepository _parentRepo;

  Future<void> fetchEta(String tripId, String studentId) async {
    state = state.copyWith(isLoadingEta: true, etaError: null);
    try {
      final eta = await _parentRepo.getEta(tripId, studentId: studentId);
      state = TrackingState(eta: eta, isLoadingEta: false);
    } catch (e) {
      state = TrackingState(isLoadingEta: false, etaError: e.toString());
    }
  }
}

final trackingProvider = StateNotifierProvider.family<TrackingNotifier, TrackingState, String>(
  (ref, studentId) => TrackingNotifier(ref.watch(parentRepositoryProvider)),
);

class NotificationsState {
  const NotificationsState({
    this.items = const [],
    this.isLoading = false,
    this.error,
  });

  final List<NotificationModel> items;
  final bool isLoading;
  final String? error;

  NotificationsState copyWith({
    List<NotificationModel>? items,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return NotificationsState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier(this._parentRepo) : super(const NotificationsState());

  final ParentRepository _parentRepo;

  void reset() {
    state = const NotificationsState();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final items = await _parentRepo.getNotifications();
      state = NotificationsState(items: items, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _parentRepo.markNotificationRead(id);
      final updated = state.items.map((n) {
        if (n.id != id) return n;
        return NotificationModel(
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          status: 'READ',
          createdAt: n.createdAt,
        );
      }).toList();
      state = state.copyWith(items: updated);
    } catch (_) {
      // Keep unread UI if API fails.
    }
  }

  Future<void> markAllRead() async {
    await _parentRepo.markAllNotificationsRead();
    await load();
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final notifier = NotificationsNotifier(ref.watch(parentRepositoryProvider));

  ref.listen<AuthState>(authProvider, (prev, next) {
    if (next.isAuthenticated && prev?.isAuthenticated != true) {
      notifier.load();
    } else if (!next.isAuthenticated && prev?.isAuthenticated == true) {
      notifier.reset();
    } else if (next.isAuthenticated && prev == null) {
      notifier.load();
    }
  }, fireImmediately: true);

  return notifier;
});
