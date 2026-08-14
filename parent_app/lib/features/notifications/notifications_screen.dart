import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/providers/app_providers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    final dateFormat = DateFormat('MMM d, HH:mm');

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: state.items.isEmpty
                ? null
                : () => ref.read(notificationsProvider.notifier).markAllRead(),
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(notificationsProvider.notifier).load(),
        child: state.isLoading && state.items.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 200),
                  Center(child: CircularProgressIndicator()),
                ],
              )
            : state.error != null && state.items.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 120),
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            children: [
                              Text(state.error!, textAlign: TextAlign.center),
                              const SizedBox(height: 12),
                              FilledButton(
                                onPressed: () =>
                                    ref.read(notificationsProvider.notifier).load(),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  )
                : state.items.isEmpty
                    ? ListView(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                          Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.notifications_none, size: 64, color: AppTheme.border),
                                const SizedBox(height: 12),
                                const Text(
                                  'You’re all caught up',
                                  style: TextStyle(color: AppTheme.textSecondary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final n = state.items[index];
                          final isUnread = n.status != 'READ';
                          return Card(
                            color: isUnread ? AppTheme.navy.withValues(alpha: 0.06) : null,
                            child: ListTile(
                              onTap: isUnread
                                  ? () => ref.read(notificationsProvider.notifier).markRead(n.id)
                                  : null,
                              leading: CircleAvatar(
                                backgroundColor: _iconColor(n.type).withValues(alpha: 0.15),
                                child: Icon(_iconForType(n.type), color: _iconColor(n.type), size: 20),
                              ),
                              title: Text(
                                n.title,
                                style: TextStyle(
                                  fontWeight: isUnread ? FontWeight.bold : FontWeight.w500,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(n.body),
                                  const SizedBox(height: 4),
                                  Text(
                                    dateFormat.format(n.createdAt.toLocal()),
                                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                              isThreeLine: true,
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'EMERGENCY':
        return Icons.warning_amber_rounded;
      case 'PICKUP_APPROACHING':
      case 'PICKUP_COMPLETED':
        return Icons.arrow_upward;
      case 'DROP_APPROACHING':
      case 'DROP_COMPLETED':
        return Icons.arrow_downward;
      case 'TRIP_STARTED':
      case 'TRIP_ENDED':
        return Icons.directions_bus;
      default:
        return Icons.notifications;
    }
  }

  Color _iconColor(String type) {
    if (type == 'EMERGENCY') return AppTheme.danger;
    if (type.contains('PICKUP')) return AppTheme.navy;
    if (type.contains('DROP')) return AppTheme.orange;
    return AppTheme.navy;
  }
}
