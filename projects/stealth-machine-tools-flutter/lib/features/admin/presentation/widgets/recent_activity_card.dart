import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/providers/database_provider.dart';

class RecentActivityCard extends ConsumerWidget {
  const RecentActivityCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: SMTTheme.primaryWhite,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Activity',
                style: SMTTheme.heading3.copyWith(
                  color: SMTTheme.primaryBlack,
                ),
              ),
              TextButton(
                onPressed: () {
                  // TODO: View all activity
                },
                child: Text(
                  'View All',
                  style: TextStyle(
                    color: SMTTheme.primaryRed,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 300, // Fixed height instead of Expanded
            child: _buildRecentActivityList(ref),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivityList(WidgetRef ref) {
    final usersAsync = ref.watch(allUsersProvider);
    final ticketsAsync = ref.watch(allTicketsProvider);
    
    return usersAsync.when(
      data: (users) => ticketsAsync.when(
        data: (tickets) {
          // Create activity items from real data
          final activities = <Widget>[];
          
          // Add recent users
          final recentUsers = users.take(3).toList();
          for (final user in recentUsers) {
            activities.add(
              _buildActivityItem(
                icon: Icons.person_add,
                title: 'New ${user.userType.name} registered',
                subtitle: '${user.fullName} - ${user.email}',
                time: _formatTimeAgo(user.createdAt),
                color: Colors.green,
              ),
            );
          }
          
          // Add recent tickets
          final recentTickets = tickets.take(2).toList();
          for (final ticket in recentTickets) {
            activities.add(
              _buildActivityItem(
                icon: Icons.support_agent,
                title: 'Support ticket ${ticket.status.name}',
                subtitle: '${ticket.title} - #${ticket.id}',
                time: _formatTimeAgo(ticket.createdAt),
                color: ticket.status.name == 'resolved' ? Colors.blue : Colors.orange,
              ),
            );
          }
          
          // Add system activity
          activities.add(
            _buildActivityItem(
              icon: Icons.admin_panel_settings,
              title: 'System initialized',
              subtitle: 'Database and services started',
              time: 'Just now',
              color: Colors.purple,
            ),
          );
          
          if (activities.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    size: 48,
                    color: SMTTheme.lightGrey2,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No recent activity',
                    style: SMTTheme.bodyMedium.copyWith(
                      color: SMTTheme.darkGrey,
                    ),
                  ),
                ],
              ),
            );
          }
          
          return ListView(children: activities);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text(
            'Error loading tickets: $error',
            style: const TextStyle(color: Colors.red),
          ),
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Text(
          'Error loading users: $error',
          style: const TextStyle(color: Colors.red),
        ),
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }

  Widget _buildActivityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required String time,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: color,
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: SMTTheme.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: SMTTheme.primaryBlack,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: SMTTheme.bodySmall.copyWith(
                    color: SMTTheme.darkGrey,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: SMTTheme.bodySmall.copyWith(
                    color: SMTTheme.lightGrey2,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
