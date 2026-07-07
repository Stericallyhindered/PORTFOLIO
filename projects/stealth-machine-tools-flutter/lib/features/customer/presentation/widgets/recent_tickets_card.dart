import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';

class RecentTicketsCard extends StatelessWidget {
  const RecentTicketsCard({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock data - in real app this would come from state management
    final recentTickets = [
      {
        'id': 'SMT-2024-001',
        'title': 'Laser cutting quality issues',
        'status': 'In Progress',
        'priority': 'High',
        'createdAt': '2024-01-15T10:30:00Z',
        'machineModel': 'SS1510',
      },
      {
        'id': 'SMT-2024-002',
        'title': 'Machine calibration needed',
        'status': 'Resolved',
        'priority': 'Medium',
        'createdAt': '2024-01-10T14:20:00Z',
        'machineModel': 'S1660 Max',
      },
      {
        'id': 'SMT-2024-003',
        'title': 'Software update request',
        'status': 'Open',
        'priority': 'Low',
        'createdAt': '2024-01-08T09:15:00Z',
        'machineModel': 'SMT-2000',
      },
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Support Tickets',
                  style: SMTTheme.heading3,
                ),
                TextButton(
                  onPressed: () => context.push('/customer/tickets'),
                  child: const Text('View All'),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            if (recentTickets.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(
                        Icons.support_agent_outlined,
                        size: 48,
                        color: SMTTheme.primaryGrey,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No recent tickets',
                        style: SMTTheme.bodyLarge.copyWith(
                          color: SMTTheme.primaryGrey,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Create a support ticket when you need help',
                        style: SMTTheme.bodyMedium.copyWith(
                          color: SMTTheme.secondaryGrey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              Column(
                children: recentTickets.take(3).map((ticket) {
                  return _buildTicketItem(context, ticket);
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketItem(BuildContext context, Map<String, dynamic> ticket) {
    final status = ticket['status'] as String;
    final priority = ticket['priority'] as String;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: SMTTheme.lightGrey,
        borderRadius: BorderRadius.circular(8),
      ),
      child: InkWell(
        onTap: () => context.push('/customer/tickets'),
        borderRadius: BorderRadius.circular(8),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _getPriorityColor(priority).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _getPriorityIcon(priority),
                color: _getPriorityColor(priority),
                size: 20,
              ),
            ),
            
            const SizedBox(width: 12),
            
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ticket['title'],
                    style: SMTTheme.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 4),
                  
                  Text(
                    '${ticket['machineModel']} • ${ticket['id']}',
                    style: SMTTheme.bodySmall.copyWith(
                      color: SMTTheme.primaryGrey,
                    ),
                  ),
                  
                  const SizedBox(height: 4),
                  
                  Row(
                    children: [
                      _buildStatusChip(status),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(ticket['createdAt']),
                        style: SMTTheme.caption,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: SMTTheme.primaryGrey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'open':
        color = Colors.blue;
        break;
      case 'in progress':
        color = Colors.orange;
        break;
      case 'resolved':
        color = Colors.green;
        break;
      case 'closed':
        color = SMTTheme.primaryGrey;
        break;
      default:
        color = SMTTheme.primaryGrey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status,
        style: SMTTheme.caption.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      case 'low':
        return Colors.green;
      default:
        return SMTTheme.primaryGrey;
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return Icons.priority_high;
      case 'medium':
        return Icons.remove;
      case 'low':
        return Icons.keyboard_arrow_down;
      default:
        return Icons.help;
    }
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        return 'Today';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return '${date.month}/${date.day}/${date.year}';
      }
    } catch (e) {
      return dateString;
    }
  }
}
