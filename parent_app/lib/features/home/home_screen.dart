import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/parent_models.dart';
import '../../shared/providers/app_providers.dart';
import '../../shared/services/parent_repository.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkEmergency());
  }

  void _checkEmergency() {
    final emergency = ref.read(childrenProvider).emergencyAlert;
    if (emergency != null) _showEmergencyDialog(emergency);
  }

  void _showEmergencyDialog(Map<String, dynamic> alert) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        icon: const Icon(Icons.warning_amber_rounded, color: AppTheme.danger, size: 40),
        title: Text(
          alert['title']?.toString() ?? 'Transport Alert',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        content: Text(
          alert['message']?.toString() ??
              'An important update has been reported on your child’s bus. Students are safe.',
          style: const TextStyle(color: AppTheme.textSecondary, height: 1.4),
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                ref.read(childrenProvider.notifier).clearEmergency();
                Navigator.pop(ctx);
              },
              child: const Text('Acknowledge'),
            ),
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final childrenState = ref.watch(childrenProvider);
    final firstName = auth.user?.firstName ?? 'Parent';
    final schoolName = auth.user?.school?.name;

    ref.listen<ChildrenState>(childrenProvider, (prev, next) {
      if (next.emergencyAlert != null && prev?.emergencyAlert == null) {
        _showEmergencyDialog(next.emergencyAlert!);
      }
      final prevId = prev?.latestNotification?.id;
      final nextNotification = next.latestNotification;
      if (nextNotification != null && nextNotification.id != prevId) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${nextNotification.title}: ${nextNotification.body}'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        ref.read(childrenProvider.notifier).clearLatestNotification();
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.primary,
          onRefresh: () => ref.read(childrenProvider.notifier).refresh(),
          child: childrenState.isLoading && childrenState.children.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 240),
                    Center(child: CircularProgressIndicator()),
                  ],
                )
              : ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
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
                    const Text(
                      'Here’s today’s school transport status.',
                      style: TextStyle(
                        fontSize: 15,
                        color: AppTheme.textSecondary,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (childrenState.error != null)
                      _ErrorBanner(
                        message: childrenState.error!,
                        onRetry: () => ref.read(childrenProvider.notifier).refresh(),
                      )
                    else if (childrenState.children.isEmpty)
                      const _NoChildrenEmptyState()
                    else
                      ...childrenState.children.map(
                        (child) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _ChildCard(
                            child: child,
                            schoolName: schoolName,
                          ),
                        ),
                      ),
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
          const SizedBox(height: 8),
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

class _NoChildrenEmptyState extends StatelessWidget {
  const _NoChildrenEmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.child_care_outlined, color: AppTheme.primary, size: 28),
          ),
          const SizedBox(height: 20),
          const Text(
            'No children linked yet',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Your school has not linked a student to this account yet. Please contact the school if you believe this is incorrect.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChildCard extends ConsumerStatefulWidget {
  const _ChildCard({required this.child, this.schoolName});

  final ChildModel child;
  final String? schoolName;

  @override
  ConsumerState<_ChildCard> createState() => _ChildCardState();
}

class _ChildCardState extends ConsumerState<_ChildCard> {
  EtaModel? _eta;
  bool _etaLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadEta());
  }

  @override
  void didUpdateWidget(covariant _ChildCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    final oldTrip = oldWidget.child.activeTrip?.id;
    final newTrip = widget.child.activeTrip?.id;
    if (oldTrip != newTrip) {
      _eta = null;
      _loadEta();
    }
  }

  Future<void> _loadEta() async {
    final trip = widget.child.activeTrip;
    if (trip == null || !trip.isActive) return;
    setState(() => _etaLoading = true);
    try {
      final eta = await ref.read(parentRepositoryProvider).getEta(
            trip.id,
            studentId: widget.child.id,
          );
      if (!mounted) return;
      setState(() {
        _eta = eta;
        _etaLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _etaLoading = false);
    }
  }

  TripStatusInfo _statusInfo() {
    final trip = widget.child.activeTrip;
    if (trip != null && trip.isActive) {
      return const TripStatusInfo(
        label: 'On Route',
        icon: Icons.near_me_rounded,
        foreground: AppTheme.navy,
        background: Color(0x1A001E4E),
      );
    }
    return const TripStatusInfo(
      label: 'No Active Trip',
      icon: Icons.schedule_rounded,
      foreground: AppTheme.textSecondary,
      background: Color(0xFFF1F4F8),
    );
  }

  String _tripLabel() {
    if (widget.child.activeTrip?.isActive == true) {
      final hour = DateTime.now().hour;
      return hour < 12 ? 'Morning Trip' : 'Return Trip';
    }
    return 'Next Trip';
  }

  String? _supportingMessage() {
    if (widget.child.activeTrip?.isActive == true) return null;
    if (widget.child.activeAssignment == null) {
      return 'No bus is currently assigned to this student.';
    }
    return 'You’ll see live status here when the trip starts.';
  }

  @override
  Widget build(BuildContext context) {
    final child = widget.child;
    final assignment = child.activeAssignment;
    final isLive = child.activeTrip?.isActive == true;
    final status = _statusInfo();
    final canOpen = assignment != null;

    return Material(
      color: AppTheme.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: canOpen ? () => context.push('/track/${child.id}') : null,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          child.fullName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          [
                            if (child.grade != null) 'Grade ${child.grade}',
                            if (widget.schoolName != null) widget.schoolName!,
                          ].join(' • '),
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.textSecondary,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  _TripStatusChip(info: status),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                _tripLabel(),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 10),
              if (assignment?.bus != null)
                _MetaRow(
                  icon: Icons.directions_bus_filled_rounded,
                  label: 'Bus',
                  value: assignment!.bus!.plateNumber,
                ),
              if (isLive) ...[
                const SizedBox(height: 8),
                _MetaRow(
                  icon: Icons.timer_outlined,
                  label: 'ETA to stop',
                  value: _etaLoading
                      ? 'Updating…'
                      : (_eta?.durationText ?? 'Calculating…'),
                ),
              ] else if (_supportingMessage() != null) ...[
                const SizedBox(height: 4),
                Text(
                  _supportingMessage()!,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
              if (canOpen) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: isLive
                      ? ElevatedButton(
                          onPressed: () => context.push('/track/${child.id}'),
                          child: const Text('Track Bus'),
                        )
                      : OutlinedButton(
                          onPressed: () => context.push('/track/${child.id}'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: const BorderSide(color: AppTheme.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            textStyle: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          child: const Text('View Details'),
                        ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class TripStatusInfo {
  const TripStatusInfo({
    required this.label,
    required this.icon,
    required this.foreground,
    required this.background,
  });

  final String label;
  final IconData icon;
  final Color foreground;
  final Color background;
}

class _TripStatusChip extends StatelessWidget {
  const _TripStatusChip({required this.info});

  final TripStatusInfo info;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: info.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(info.icon, size: 14, color: info.foreground),
          const SizedBox(width: 6),
          Text(
            info.label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: info.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
