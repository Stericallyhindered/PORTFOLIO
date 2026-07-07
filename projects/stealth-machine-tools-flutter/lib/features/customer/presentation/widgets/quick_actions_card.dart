import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';

class QuickActionsCard extends StatelessWidget {
  const QuickActionsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: SMTTheme.heading3,
            ),
            
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: _buildQuickAction(
                    context,
                    'AI Chat',
                    'Get instant help',
                    Icons.chat,
                    SMTTheme.primaryRed,
                    () => context.push('/customer/chat'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickAction(
                    context,
                    'Support Ticket',
                    'Create a ticket',
                    Icons.support_agent,
                    Colors.blue,
                    () => context.push('/customer/tickets'),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: _buildQuickAction(
                    context,
                    'AR Troubleshoot',
                    'Camera-guided help',
                    Icons.camera_alt,
                    Colors.purple,
                    () => context.push('/ar/troubleshooting/machine-1'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickAction(
                    context,
                    'Training',
                    'Learn & improve',
                    Icons.school,
                    Colors.green,
                    () => context.push('/training/modules'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: SMTTheme.primaryWhite,
                size: 20,
              ),
            ),
            
            const SizedBox(height: 8),
            
            Text(
              title,
              style: SMTTheme.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            
            Text(
              subtitle,
              style: SMTTheme.caption,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
