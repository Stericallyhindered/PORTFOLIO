import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/providers/database_provider.dart';

class SystemOverviewCard extends ConsumerWidget {
  const SystemOverviewCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: SMTTheme.darkHeaderGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Stealth Machine Tools',
                    style: SMTTheme.heading1.copyWith(
                      color: SMTTheme.primaryWhite,
                      fontSize: 24,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Advanced CNC Machine Solutions',
                    style: SMTTheme.bodyLarge.copyWith(
                      color: SMTTheme.lightGrey2,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.dashboard,
                  color: Colors.white,
                  size: 32,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildSystemStatus(ref),
        ],
      ),
    );
  }

  Widget _buildSystemStatus(WidgetRef ref) {
    final statsAsync = ref.watch(systemAnalyticsProvider);
    
    return statsAsync.when(
      data: (stats) => Row(
        children: [
          Expanded(
            child: _buildOverviewItem(
              'System Status',
              'Operational',
              Icons.check_circle,
              Colors.green,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildOverviewItem(
              'Total Users',
              stats['totalUsers']?.toString() ?? '0',
              Icons.people,
              Colors.blue,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildOverviewItem(
              'Active Machines',
              stats['totalMachines']?.toString() ?? '0',
              Icons.precision_manufacturing,
              Colors.orange,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildOverviewItem(
              'Open Tickets',
              stats['openTickets']?.toString() ?? '0',
              Icons.support_agent,
              Colors.purple,
            ),
          ),
        ],
      ),
      loading: () => Row(
        children: [
          Expanded(child: _buildLoadingItem()),
          const SizedBox(width: 16),
          Expanded(child: _buildLoadingItem()),
          const SizedBox(width: 16),
          Expanded(child: _buildLoadingItem()),
          const SizedBox(width: 16),
          Expanded(child: _buildLoadingItem()),
        ],
      ),
      error: (error, stack) => Row(
        children: [
          Expanded(
            child: _buildOverviewItem(
              'System Status',
              'Error',
              Icons.error,
              Colors.red,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildOverviewItem(
              'Error',
              'Loading failed',
              Icons.error_outline,
              Colors.red,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildOverviewItem(
              'Error',
              'Loading failed',
              Icons.error_outline,
              Colors.red,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildOverviewItem(
              'Error',
              'Loading failed',
              Icons.error_outline,
              Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingItem() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 60,
            height: 12,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: 40,
            height: 10,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewItem(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 24,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: SMTTheme.heading3.copyWith(
              color: SMTTheme.primaryWhite,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: SMTTheme.bodySmall.copyWith(
              color: SMTTheme.lightGrey2,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
