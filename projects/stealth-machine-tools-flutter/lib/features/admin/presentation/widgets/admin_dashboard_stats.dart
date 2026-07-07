import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/providers/database_provider.dart';
import 'admin_stats_card.dart';

class AdminDashboardStats extends ConsumerWidget {
  const AdminDashboardStats({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(systemAnalyticsProvider);

    return statsAsync.when(
      data: (stats) => Row(
        children: [
          Expanded(
            child: AdminStatsCard(
              title: 'Total Customers',
              value: stats['totalCustomers']?.toString() ?? '0',
              icon: Icons.people,
              color: Colors.blue,
              trend: '+12%',
              trendUp: true,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: AdminStatsCard(
              title: 'Active Machines',
              value: stats['totalMachines']?.toString() ?? '0',
              icon: Icons.precision_manufacturing,
              color: Colors.green,
              trend: '+8%',
              trendUp: true,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: AdminStatsCard(
              title: 'Support Tickets',
              value: stats['totalTickets']?.toString() ?? '0',
              icon: Icons.support_agent,
              color: Colors.orange,
              trend: stats['openTickets'] != null && stats['openTickets']! > 0 
                  ? '${stats['openTickets']} open' 
                  : 'All resolved',
              trendUp: stats['openTickets'] == 0,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: AdminStatsCard(
              title: 'Training Completed',
              value: stats['publishedTrainingModules']?.toString() ?? '0',
              icon: Icons.school,
              color: Colors.purple,
              trend: '+15%',
              trendUp: true,
            ),
          ),
        ],
      ),
      loading: () => const Row(
        children: [
          Expanded(child: _LoadingStatsCard()),
          SizedBox(width: 16),
          Expanded(child: _LoadingStatsCard()),
          SizedBox(width: 16),
          Expanded(child: _LoadingStatsCard()),
          SizedBox(width: 16),
          Expanded(child: _LoadingStatsCard()),
        ],
      ),
      error: (error, stack) => Row(
        children: [
          Expanded(
            child: _ErrorStatsCard('Error loading stats: $error'),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _ErrorStatsCard('Error loading stats: $error'),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _ErrorStatsCard('Error loading stats: $error'),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _ErrorStatsCard('Error loading stats: $error'),
          ),
        ],
      ),
    );
  }
}

class _LoadingStatsCard extends StatelessWidget {
  const _LoadingStatsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: SMTTheme.lightGrey2,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              Container(
                width: 60,
                height: 24,
                decoration: BoxDecoration(
                  color: SMTTheme.lightGrey2,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: 80,
            height: 28,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: 120,
            height: 16,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorStatsCard extends StatelessWidget {
  final String error;
  
  const _ErrorStatsCard(this.error);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.error_outline,
                  color: Colors.red,
                  size: 24,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Error',
            style: SMTTheme.heading1.copyWith(
              fontSize: 28,
              color: Colors.red,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            error,
            style: SMTTheme.bodyMedium.copyWith(
              color: Colors.red,
              fontSize: 12,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
