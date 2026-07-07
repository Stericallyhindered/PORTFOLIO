import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';

class MachineCard extends StatelessWidget {
  final String machineModel;
  final String serialNumber;
  final String status;
  final String lastService;
  final String nextService;
  final int hoursRun;

  const MachineCard({
    super.key,
    required this.machineModel,
    required this.serialNumber,
    required this.status,
    required this.lastService,
    required this.nextService,
    required this.hoursRun,
  });

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'online':
        return Colors.green;
      case 'maintenance due':
        return Colors.orange;
      case 'offline':
        return Colors.red;
      case 'error':
        return Colors.red;
      default:
        return SMTTheme.primaryGrey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'online':
        return Icons.check_circle;
      case 'maintenance due':
        return Icons.schedule;
      case 'offline':
        return Icons.offline_bolt;
      case 'error':
        return Icons.error;
      default:
        return Icons.help;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(status);
    
    return Card(
      child: InkWell(
        onTap: () => context.push('/customer/machine/$serialNumber'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: SMTTheme.primaryRed.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.precision_manufacturing,
                      color: SMTTheme.primaryRed,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          machineModel,
                          style: SMTTheme.bodyLarge.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          serialNumber,
                          style: SMTTheme.bodySmall.copyWith(
                            color: SMTTheme.primaryGrey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: statusColor.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _getStatusIcon(status),
                          size: 12,
                          color: statusColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          status,
                          style: SMTTheme.caption.copyWith(
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Machine Stats
              Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      'Hours Run',
                      hoursRun.toString(),
                      Icons.schedule,
                      SMTTheme.primaryGrey,
                    ),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      'Last Service',
                      _formatDate(lastService),
                      Icons.build,
                      Colors.blue,
                    ),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      'Next Service',
                      _formatDate(nextService),
                      Icons.event,
                      Colors.orange,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/customer/machine/$serialNumber'),
                      icon: const Icon(Icons.info_outline, size: 16),
                      label: const Text('Details'),
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
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(height: 4),
          Text(
            value,
            style: SMTTheme.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          Text(
            label,
            style: SMTTheme.caption,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }
}
