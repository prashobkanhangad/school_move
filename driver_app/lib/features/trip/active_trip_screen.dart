import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/route_model.dart';
import '../../shared/providers/app_providers.dart';

class ActiveTripScreen extends ConsumerStatefulWidget {
  const ActiveTripScreen({super.key});

  @override
  ConsumerState<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends ConsumerState<ActiveTripScreen> {
  Timer? _tick;

  @override
  void initState() {
    super.initState();
    _tick = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  bool get _gpsFresh {
    final lastSent = ref.read(tripProvider).lastSentAt;
    if (lastSent == null) return false;
    return DateTime.now().difference(lastSent).inSeconds < 30;
  }

  String _updatedLabel(DateTime? lastSent) {
    if (lastSent == null) return 'Waiting for first GPS update…';
    final seconds = DateTime.now().difference(lastSent).inSeconds;
    if (seconds < 5) return 'Updated just now';
    if (seconds < 60) return 'Updated $seconds sec ago';
    final minutes = seconds ~/ 60;
    return 'Updated $minutes min ago';
  }

  Future<void> _confirmEndTrip() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'End Trip?',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        content: const Text(
          'This will stop GPS sharing and mark the trip as complete.',
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
              backgroundColor: AppTheme.navy,
              foregroundColor: AppTheme.white,
              minimumSize: const Size(0, 44),
            ),
            child: const Text('End Trip'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await ref.read(tripProvider.notifier).endTrip();
        if (mounted) context.go('/home');
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
      }
    }
  }

  Future<void> _showEmergencyDialog() async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Send transport alert?',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'School admins and parents on this route will be notified immediately. Students’ safety status should remain clear.',
              style: TextStyle(color: AppTheme.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Message (optional)',
                hintText: 'Describe the situation',
              ),
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
              foregroundColor: AppTheme.white,
              minimumSize: const Size(0, 44),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Send Alert'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await ref.read(tripProvider.notifier).sendEmergency(
              message: controller.text.trim().isEmpty ? null : controller.text.trim(),
            );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Emergency alert sent to school and parents.'),
              backgroundColor: AppTheme.danger,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
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
      }
    }
    controller.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(tripProvider);
    final trip = tripState.activeTrip;

    if (trip == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/home');
      });
      return const Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final timeFormat = DateFormat('h:mm a');
    final position = tripState.lastPosition;
    final speedKmh = position != null ? (position.speed * 3.6).clamp(0, 200) : null;
    final stops = trip.route?.stops ?? const <RouteStopModel>[];
    final gpsLive = tripState.isTracking && _gpsFresh;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
              child: Row(
                children: [
                  IconButton(
                    tooltip: 'Back to home',
                    onPressed: () => context.go('/home'),
                    icon: const Icon(Icons.arrow_back_rounded),
                    color: AppTheme.textPrimary,
                  ),
                  const Expanded(
                    child: Text(
                      'Active Trip',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  _LiveChip(isLive: gpsLive),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                children: [
                  _StatusHero(
                    routeName: trip.route?.name ?? 'School route',
                    busPlate: trip.bus?.plateNumber,
                    startedAt: trip.startedAt != null
                        ? timeFormat.format(trip.startedAt!.toLocal())
                        : null,
                    isTracking: tripState.isTracking,
                    gpsLive: gpsLive,
                    updatedLabel: _updatedLabel(tripState.lastSentAt),
                    skipReason: tripState.lastSkipReason,
                  ),
                  const SizedBox(height: 16),
                  _InfoCard(
                    title: 'Trip details',
                    children: [
                      _InfoRow(
                        icon: Icons.directions_bus_filled_rounded,
                        label: 'Bus',
                        value: trip.bus?.plateNumber ?? '—',
                      ),
                      _InfoRow(
                        icon: Icons.schedule_rounded,
                        label: 'Started',
                        value: trip.startedAt != null
                            ? timeFormat.format(trip.startedAt!.toLocal())
                            : '—',
                      ),
                      _InfoRow(
                        icon: Icons.place_outlined,
                        label: 'Stops',
                        value: '${stops.length}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _InfoCard(
                    title: 'Live location',
                    children: [
                      _InfoRow(
                        icon: Icons.my_location_rounded,
                        label: 'Coordinates',
                        value: position != null
                            ? '${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}'
                            : 'Acquiring…',
                      ),
                      _InfoRow(
                        icon: Icons.gps_fixed_rounded,
                        label: 'Accuracy',
                        value: position != null
                            ? '${position.accuracy.toStringAsFixed(0)} m'
                            : '—',
                      ),
                      if (speedKmh != null)
                        _InfoRow(
                          icon: Icons.speed_rounded,
                          label: 'Current speed',
                          value: '${speedKmh.toStringAsFixed(0)} km/h',
                          muted: true,
                        ),
                    ],
                  ),
                  if (stops.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Text(
                      'Route stops',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _StopsTimeline(stops: stops),
                  ],
                  const SizedBox(height: 28),
                  SizedBox(
                    height: 52,
                    child: OutlinedButton(
                      onPressed: tripState.isLoading ? null : _confirmEndTrip,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.textPrimary,
                        side: const BorderSide(color: AppTheme.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      child: tripState.isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            )
                          : const Text('End Trip'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: tripState.isLoading ? null : _showEmergencyDialog,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.danger,
                        foregroundColor: AppTheme.white,
                        disabledBackgroundColor:
                            AppTheme.danger.withValues(alpha: 0.45),
                        disabledForegroundColor: AppTheme.white,
                      ),
                      child: const Text('Send Emergency Alert'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Use only for real incidents. Parents and school staff will be notified.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LiveChip extends StatelessWidget {
  const _LiveChip({required this.isLive});

  final bool isLive;

  @override
  Widget build(BuildContext context) {
    final fg = isLive ? AppTheme.navy : AppTheme.orange;
    final bg = isLive ? const Color(0x1A001E4E) : const Color(0x1AFCA200);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            isLive ? 'LIVE' : 'SYNCING',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: fg,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusHero extends StatelessWidget {
  const _StatusHero({
    required this.routeName,
    required this.isTracking,
    required this.gpsLive,
    required this.updatedLabel,
    this.busPlate,
    this.startedAt,
    this.skipReason,
  });

  final String routeName;
  final String? busPlate;
  final String? startedAt;
  final bool isTracking;
  final bool gpsLive;
  final String updatedLabel;
  final String? skipReason;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
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
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
              letterSpacing: -0.3,
            ),
          ),
          if (busPlate != null) ...[
            const SizedBox(height: 6),
            Text(
              'Bus $busPlate',
              style: const TextStyle(fontSize: 15, color: AppTheme.textSecondary),
            ),
          ],
          if (startedAt != null) ...[
            const SizedBox(height: 4),
            Text(
              'Started $startedAt',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
          ],
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: gpsLive
                  ? AppTheme.navy.withValues(alpha: 0.06)
                  : AppTheme.orange.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.gps_fixed_rounded,
                      size: 18,
                      color: gpsLive ? AppTheme.success : AppTheme.warning,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        !isTracking
                            ? 'GPS reconnecting…'
                            : gpsLive
                                ? 'Sharing live location'
                                : 'Waiting for recent GPS update',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: gpsLive ? AppTheme.success : AppTheme.warning,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  updatedLabel,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
                if (skipReason != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    skipReason!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.orange,
                      height: 1.3,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.muted = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary),
          ),
        ),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: muted ? 13 : 14,
              fontWeight: muted ? FontWeight.w500 : FontWeight.w600,
              color: muted ? AppTheme.textSecondary : AppTheme.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class _StopsTimeline extends StatelessWidget {
  const _StopsTimeline({required this.stops});

  final List<RouteStopModel> stops;

  String _stopTypeLabel(String type) {
    switch (type.toUpperCase()) {
      case 'PICKUP':
        return 'Pickup';
      case 'DROPOFF':
        return 'Drop-off';
      case 'SCHOOL':
        return 'School';
      case 'BOTH':
        return 'Pickup & drop-off';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          for (var i = 0; i < stops.length; i++) ...[
            _StopRow(
              order: stops[i].stopOrder,
              name: stops[i].name,
              typeLabel: _stopTypeLabel(stops[i].stopType),
              isFirst: i == 0,
              isLast: i == stops.length - 1,
            ),
          ],
        ],
      ),
    );
  }
}

class _StopRow extends StatelessWidget {
  const _StopRow({
    required this.order,
    required this.name,
    required this.typeLabel,
    required this.isFirst,
    required this.isLast,
  });

  final int order;
  final String name;
  final String typeLabel;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '$order',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: AppTheme.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 8 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    typeLabel,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
