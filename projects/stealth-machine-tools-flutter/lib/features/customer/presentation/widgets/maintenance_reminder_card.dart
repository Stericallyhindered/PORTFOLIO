import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';

class MaintenanceReminderCard extends StatelessWidget {
  const MaintenanceReminderCard({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock data - in real app this would come from state management
    final maintenanceReminders = [
      {
        'machineModel': 'SS1510 Compact Type Fiber Laser',
        'serialNumber': 'SMT-SS1510-2024-001',
        'serviceType': 'Routine Maintenance',
        'dueDate': '2024-02-15',
        'hoursOverdue': 0,
        'priority': 'medium',
      },
      {
        'machineModel': 'S1660 Max Fiber Laser',
        'serialNumber': 'SMT-S1660-2023-045',
        'serviceType': 'Filter Replacement',
        'dueDate': '2024-01-20',
        'hoursOverdue': 120,
        'priority': 'high',
      },
    ];

    final upcomingReminders = maintenanceReminders.where((reminder) {
      final dueDate = DateTime.parse(reminder['dueDate'] as String);
      final now = DateTime.now();
      return dueDate.isAfter(now) || reminder['hoursOverdue'] as int > 0;
    }).toList();

    if (upcomingReminders.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Colors.orange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.schedule,
                    color: SMTTheme.primaryWhite,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Maintenance Reminders',
                  style: SMTTheme.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    // TODO: Navigate to maintenance schedule
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Maintenance schedule coming soon'),
                      ),
                    );
                  },
                  child: const Text('Schedule'),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            ...upcomingReminders.map((reminder) {
              return _buildReminderItem(context, reminder);
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildReminderItem(BuildContext context, Map<String, dynamic> reminder) {
    final dueDate = DateTime.parse(reminder['dueDate'] as String);
    final now = DateTime.now();
    final isOverdue = dueDate.isBefore(now) || reminder['hoursOverdue'] as int > 0;
    final priority = reminder['priority'] as String;
    
    Color priorityColor;
    switch (priority) {
      case 'high':
        priorityColor = Colors.red;
        break;
      case 'medium':
        priorityColor = Colors.orange;
        break;
      case 'low':
        priorityColor = Colors.green;
        break;
      default:
        priorityColor = SMTTheme.primaryGrey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: priorityColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: priorityColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.precision_manufacturing,
                size: 16,
                color: priorityColor,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  reminder['machineModel'],
                  style: SMTTheme.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: priorityColor,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  priority.toUpperCase(),
                  style: SMTTheme.caption.copyWith(
                    color: SMTTheme.primaryWhite,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          Text(
            reminder['serviceType'],
            style: SMTTheme.bodyMedium,
          ),
          
          const SizedBox(height: 4),
          
          Row(
            children: [
              Icon(
                isOverdue ? Icons.warning : Icons.event,
                size: 14,
                color: isOverdue ? Colors.red : SMTTheme.primaryGrey,
              ),
              const SizedBox(width: 4),
              Text(
                isOverdue 
                    ? 'Overdue by ${_formatOverdue(reminder['hoursOverdue'] as int)}'
                    : 'Due ${_formatDueDate(dueDate)}',
                style: SMTTheme.bodySmall.copyWith(
                  color: isOverdue ? Colors.red : SMTTheme.primaryGrey,
                  fontWeight: isOverdue ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // TODO: Schedule maintenance
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Schedule maintenance feature coming soon'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.calendar_today, size: 16),
                  label: const Text('Schedule'),
                  style: SMTButtonStyles.secondaryButton.copyWith(
                    padding: MaterialStateProperty.all(
                      const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.push('/customer/chat'),
                  icon: const Icon(Icons.chat, size: 16),
                  label: const Text('Get Help'),
                  style: SMTButtonStyles.primaryButton.copyWith(
                    padding: MaterialStateProperty.all(
                      const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDueDate(DateTime dueDate) {
    final now = DateTime.now();
    final difference = dueDate.difference(now);

    if (difference.inDays == 0) {
      return 'today';
    } else if (difference.inDays == 1) {
      return 'tomorrow';
    } else if (difference.inDays < 7) {
      return 'in ${difference.inDays} days';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return 'in $weeks week${weeks > 1 ? 's' : ''}';
    } else {
      final months = (difference.inDays / 30).floor();
      return 'in $months month${months > 1 ? 's' : ''}';
    }
  }

  String _formatOverdue(int hoursOverdue) {
    if (hoursOverdue < 24) {
      return '$hoursOverdue hours';
    } else {
      final days = (hoursOverdue / 24).floor();
      return '$days day${days > 1 ? 's' : ''}';
    }
  }
}
