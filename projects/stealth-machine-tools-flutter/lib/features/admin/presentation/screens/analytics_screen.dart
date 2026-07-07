import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/providers/database_provider.dart';
import '../../../../core/models/user_model.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(systemAnalyticsProvider);
    final usersAsync = ref.watch(allUsersProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Analytics Dashboard'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: SMTTheme.darkHeaderGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const SMTLogoCircular(size: 60),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Analytics Dashboard',
                          style: SMTTheme.heading1.copyWith(
                            color: SMTTheme.primaryWhite,
                            fontSize: 28,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Real-time insights and performance metrics',
                          style: SMTTheme.bodyLarge.copyWith(
                            color: SMTTheme.lightGrey2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.analytics,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Key Metrics
            statsAsync.when(
              data: (stats) => _buildMetricsGrid(Map<String, int>.from(stats)),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Text('Error: $error'),
            ),
            const SizedBox(height: 24),

            // User Analytics
            usersAsync.when(
              data: (users) => _buildUserAnalytics(users),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Text('Error: $error'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricsGrid(Map<String, int> stats) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 4,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildMetricCard('Total Users', stats['totalUsers']?.toString() ?? '0', Icons.people, Colors.blue),
        _buildMetricCard('Active Machines', stats['totalMachines']?.toString() ?? '0', Icons.precision_manufacturing, Colors.green),
        _buildMetricCard('Support Tickets', stats['totalTickets']?.toString() ?? '0', Icons.support_agent, Colors.orange),
        _buildMetricCard('Training Modules', stats['publishedTrainingModules']?.toString() ?? '0', Icons.school, Colors.purple),
      ],
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
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
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: SMTTheme.heading1.copyWith(
              fontSize: 28,
              color: SMTTheme.primaryBlack,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: SMTTheme.bodyMedium.copyWith(
              color: SMTTheme.darkGrey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserAnalytics(List users) {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'User Analytics',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Text('Total Users: ${users.length}'),
          const SizedBox(height: 8),
          Text('Customers: ${users.where((u) => u.userType == UserType.customer).length}'),
          const SizedBox(height: 8),
          Text('Employees: ${users.where((u) => u.userType == UserType.employee).length}'),
          const SizedBox(height: 8),
          Text('Admins: ${users.where((u) => u.userType == UserType.admin).length}'),
        ],
      ),
    );
  }
}
