import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/login_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/tracking/tracking_screen.dart';
import '../../shared/providers/app_providers.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefresh(ref);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: refresh,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuth = authState.isAuthenticated;
      final bootstrapping = authState.isLoading;
      final onLogin = state.matchedLocation == '/login';

      if (bootstrapping) return null;
      if (!isAuth && !onLogin) {
        final from = state.uri.toString();
        if (from != '/login' && from.isNotEmpty) {
          return '/login?from=${Uri.encodeComponent(from)}';
        }
        return '/login';
      }
      if (isAuth && onLogin) {
        final from = state.uri.queryParameters['from'];
        if (from != null && from.isNotEmpty && from.startsWith('/')) {
          return from;
        }
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/notifications',
                builder: (_, __) => const NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/track/:childId',
        builder: (context, state) =>
            TrackingScreen(childId: state.pathParameters['childId']!),
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
