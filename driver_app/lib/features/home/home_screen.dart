import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/route_model.dart';
import '../../shared/providers/app_providers.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  RouteModel? _selectedRoute;
  bool _starting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final trip = ref.read(tripProvider);
      if (trip.activeTrip != null) {
        context.go('/trip');
      }
    });
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  void _syncSelectedRoute(List<RouteModel> routes) {
    if (routes.isEmpty) {
      if (_selectedRoute != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) setState(() => _selectedRoute = null);
        });
      }
      return;
    }
    final stillValid = _selectedRoute != null &&
        routes.any((r) => r.id == _selectedRoute!.id);
    if (!stillValid) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _selectedRoute = routes.first);
      });
    }
  }

  Future<void> _startTrip() async {
    final bus = ref.read(tripProvider).assignedBus;
    final route = _selectedRoute;
    if (bus == null || route == null || _starting) return;

    setState(() => _starting = true);
    try {
      await ref.read(tripProvider.notifier).startTrip(route.id, bus.id);
      if (mounted) context.go('/trip');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.danger,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Sign out?'),
        content: const Text(
          'You will need to sign in again to manage trips.',
          style: TextStyle(color: AppTheme.textSecondary, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(0, 44),
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final tripState = ref.watch(tripProvider);
    final user = auth.user;
    final hasActiveTrip = tripState.activeTrip != null;
    final firstName = user?.firstName ?? 'Driver';
    final school = user?.school?.name;

    ref.listen<TripState>(tripProvider, (prev, next) {
      if (next.activeTrip != null &&
          (prev?.activeTrip == null || prev?.activeTrip?.id != next.activeTrip?.id)) {
        context.go('/trip');
      }
    });

    if (!hasActiveTrip) {
      _syncSelectedRoute(tripState.availableRoutes);
    }

    final isBootLoading =
        tripState.isLoading && !hasActiveTrip && tripState.assignedBus == null;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: isBootLoading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                color: AppTheme.primary,
                onRefresh: () => ref.read(tripProvider.notifier).refresh(),
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${_greeting()}, $firstName',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPrimary,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                hasActiveTrip
                                    ? 'You have a trip in progress.'
                                    : 'Ready to start today’s school transport.',
                                style: const TextStyle(
                                  fontSize: 15,
                                  color: AppTheme.textSecondary,
                                  height: 1.4,
                                ),
                              ),
                              if (school != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  school,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Sign out',
                          onPressed: _logout,
                          icon: const Icon(Icons.logout_rounded),
                          color: AppTheme.textSecondary,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    if (tripState.error != null) ...[
                      _ErrorBanner(
                        message: tripState.error!,
                        onRetry: () => ref.read(tripProvider.notifier).refresh(),
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (hasActiveTrip) ...[
                      _ActiveTripCard(
                        routeName: tripState.activeTrip!.route?.name ?? 'Active trip',
                        busPlate: tripState.activeTrip!.bus?.plateNumber ??
                            tripState.assignedBus?.plateNumber,
                        isTracking: tripState.isTracking,
                        onResume: () => context.go('/trip'),
                      ),
                    ] else ...[
                      _StatusBanner(
                        hasBus: tripState.assignedBus != null,
                        routeCount: tripState.availableRoutes.length,
                      ),
                      const SizedBox(height: 16),
                      if (tripState.assignedBus != null)
                        _BusCard(bus: tripState.assignedBus!)
                      else
                        const _EmptyPanel(
                          icon: Icons.directions_bus_outlined,
                          title: 'No bus assigned',
                          message:
                              'Contact your school admin to get a bus assigned to your account.',
                        ),
                      const SizedBox(height: 24),
                      const Text(
                        'Select Route',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Choose the route you will drive for this trip.',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (tripState.assignedBus == null)
                        const _EmptyPanel(
                          icon: Icons.route_outlined,
                          title: 'Routes unavailable',
                          message: 'Routes will appear once a bus is assigned.',
                        )
                      else if (tripState.availableRoutes.isEmpty)
                        const _EmptyPanel(
                          icon: Icons.route_outlined,
                          title: 'No routes available',
                          message:
                              'There are no active routes linked to your bus right now.',
                        )
                      else
                        ...tripState.availableRoutes.map((route) {
                          final selected = _selectedRoute?.id == route.id;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _RouteCard(
                              route: route,
                              selected: selected,
                              onTap: () => setState(() => _selectedRoute = route),
                            ),
                          );
                        }),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: tripState.assignedBus == null ||
                                  _selectedRoute == null ||
                                  tripState.isLoading ||
                                  _starting
                              ? null
                              : _startTrip,
                          child: _starting || tripState.isLoading
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: AppTheme.navy,
                                  ),
                                )
                              : const Text('Start Trip'),
                        ),
                      ),
                      if (_selectedRoute != null && tripState.assignedBus != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          'GPS sharing starts when you begin the trip. Keep location permission enabled.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary.withValues(alpha: 0.9),
                            height: 1.35,
                          ),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            message,
            style: const TextStyle(color: Color(0xFF991B1B), fontSize: 14, height: 1.35),
          ),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.danger,
              padding: EdgeInsets.zero,
              minimumSize: const Size(44, 44),
            ),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.hasBus, required this.routeCount});

  final bool hasBus;
  final int routeCount;

  @override
  Widget build(BuildContext context) {
    late final String label;
    late final IconData icon;
    late final Color fg;
    late final Color bg;

    if (!hasBus) {
      label = 'Waiting for assignment';
      icon = Icons.hourglass_empty_rounded;
      fg = AppTheme.textSecondary;
      bg = const Color(0xFFF1F4F8);
    } else if (routeCount == 0) {
      label = 'No routes ready';
      icon = Icons.info_outline_rounded;
      fg = AppTheme.orange;
      bg = const Color(0x1AFCA200);
    } else {
      label = 'Ready to start';
      icon = Icons.check_circle_outline_rounded;
      fg = AppTheme.navy;
      bg = const Color(0x1A001E4E);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: fg),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: fg,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BusCard extends StatelessWidget {
  const _BusCard({required this.bus});

  final BusModel bus;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.directions_bus_filled_rounded,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Assigned Bus',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  bus.plateNumber,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                if (bus.model != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    bus.model!,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  ),
                ],
              ],
            ),
          ),
          if (bus.capacity != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '${bus.capacity} seats',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({
    required this.route,
    required this.selected,
    required this.onTap,
  });

  final RouteModel route;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.border,
              width: selected ? 1.5 : 1,
            ),
            color: selected ? AppTheme.primary.withValues(alpha: 0.04) : AppTheme.surface,
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: selected
                      ? AppTheme.primary.withValues(alpha: 0.12)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${route.stops.length}',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: selected ? AppTheme.primary : AppTheme.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      route.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (route.startTime != null) 'Starts ${route.startTime}',
                        '${route.stops.length} stops',
                      ].join(' · '),
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                color: selected ? AppTheme.primary : AppTheme.border,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActiveTripCard extends StatelessWidget {
  const _ActiveTripCard({
    required this.routeName,
    required this.onResume,
    this.busPlate,
    this.isTracking = false,
  });

  final String routeName;
  final String? busPlate;
  final bool isTracking;
  final VoidCallback onResume;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.navy.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.navy.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.near_me_rounded, size: 14, color: AppTheme.navy),
                SizedBox(width: 6),
                Text(
                  'Trip in progress',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.navy,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            routeName,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          if (busPlate != null) ...[
            const SizedBox(height: 6),
            Text(
              'Bus $busPlate',
              style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                Icons.gps_fixed_rounded,
                size: 16,
                color: isTracking ? AppTheme.success : AppTheme.warning,
              ),
              const SizedBox(width: 6),
              Text(
                isTracking ? 'GPS sharing active' : 'GPS reconnecting…',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: isTracking ? AppTheme.success : AppTheme.warning,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: onResume,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.orange),
              child: const Text('Resume Trip'),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyPanel extends StatelessWidget {
  const _EmptyPanel({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: AppTheme.primary),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
