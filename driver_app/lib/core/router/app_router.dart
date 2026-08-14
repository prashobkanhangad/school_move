import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/app_logger.dart';
import '../../features/auth/login_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/trip/active_trip_screen.dart';
import '../../shared/providers/app_providers.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefresh(ref);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: refresh,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuth = authState.isAuthenticated;
      final isBootstrapping = authState.isLoading;
      final onLogin = state.matchedLocation == '/login';

      AppLogger.info(
        'Router redirect: location=${state.matchedLocation} '
        'isAuth=$isAuth isLoading=$isBootstrapping',
        tag: 'Router',
      );

      if (isBootstrapping) return null;
      if (!isAuth && !onLogin) return '/login';
      if (isAuth && onLogin) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/trip',
        builder: (context, state) => const ActiveTripScreen(),
      ),
    ],
  );
});

class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(this.ref) {
    ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
  }
  final Ref ref;
}
