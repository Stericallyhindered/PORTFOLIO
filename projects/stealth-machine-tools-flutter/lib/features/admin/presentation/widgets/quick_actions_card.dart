import 'package:flutter/material.dart';
import '../../../../core/theme/smt_theme.dart';

class QuickActionsCard extends StatelessWidget {
  final VoidCallback onAddCustomer;
  final VoidCallback onAddEmployee;
  final VoidCallback onViewAnalytics;
  final VoidCallback onManageContent;

  const QuickActionsCard({
    super.key,
    required this.onAddCustomer,
    required this.onAddEmployee,
    required this.onViewAnalytics,
    required this.onManageContent,
  });

  @override
  Widget build(BuildContext context) {
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
            'Quick Actions',
            style: SMTTheme.heading2.copyWith(
              color: SMTTheme.primaryBlack,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Common administrative tasks',
            style: SMTTheme.bodyMedium.copyWith(
              color: SMTTheme.darkGrey,
            ),
          ),
          const SizedBox(height: 24),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.5,
            children: [
              _buildActionButton(
                title: 'Add Customer',
                subtitle: 'Register new customer',
                icon: Icons.person_add,
                color: Colors.blue,
                onTap: onAddCustomer,
              ),
              _buildActionButton(
                title: 'Add Employee',
                subtitle: 'Register new employee',
                icon: Icons.badge,
                color: Colors.green,
                onTap: onAddEmployee,
              ),
              _buildActionButton(
                title: 'View Analytics',
                subtitle: 'System performance',
                icon: Icons.analytics,
                color: Colors.orange,
                onTap: onViewAnalytics,
              ),
              _buildActionButton(
                title: 'Manage Content',
                subtitle: 'Manuals & guides',
                icon: Icons.article,
                color: Colors.purple,
                onTap: onManageContent,
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: SMTTheme.primaryRed,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'System Information',
                      style: SMTTheme.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                        color: SMTTheme.primaryBlack,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'All CNC machine operations are running smoothly. Last system check completed successfully.',
                  style: SMTTheme.bodySmall.copyWith(
                    color: SMTTheme.darkGrey,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: color,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: SMTTheme.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: SMTTheme.primaryBlack,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: SMTTheme.bodySmall.copyWith(
                      color: SMTTheme.darkGrey,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: SMTTheme.darkGrey,
            ),
          ],
        ),
      ),
    );
  }
}
