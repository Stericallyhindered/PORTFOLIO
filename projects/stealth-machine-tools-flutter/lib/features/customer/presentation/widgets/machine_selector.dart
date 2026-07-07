import 'package:flutter/material.dart';

import '../../../../core/theme/smt_theme.dart';

class MachineSelector extends StatelessWidget {
  final String? selectedMachineId;
  final ValueChanged<String?> onMachineSelected;

  const MachineSelector({
    super.key,
    this.selectedMachineId,
    required this.onMachineSelected,
  });

  @override
  Widget build(BuildContext context) {
    // Mock data - in real app this would come from state management
    final machines = [
      {
        'id': 'machine-1',
        'model': 'SS1510 Compact Type Fiber Laser',
        'serialNumber': 'SMT-SS1510-2024-001',
        'status': 'Online',
      },
      {
        'id': 'machine-2',
        'model': 'S1660 Max Fiber Laser',
        'serialNumber': 'SMT-S1660-2023-045',
        'status': 'Maintenance Due',
      },
      {
        'id': 'machine-3',
        'model': 'SMT-2000 Press Brake',
        'serialNumber': 'SMT-PB2000-2024-012',
        'status': 'Online',
      },
      {
        'id': 'general',
        'model': 'General Support',
        'serialNumber': 'No specific machine',
        'status': 'Available',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select Machine (Optional)',
          style: SMTTheme.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
            color: SMTTheme.primaryGrey,
          ),
        ),
        
        const SizedBox(height: 8),
        
        Container(
          height: 60,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: machines.length,
            itemBuilder: (context, index) {
              final machine = machines[index];
              final isSelected = selectedMachineId == machine['id'];
              
              return Container(
                width: 200,
                margin: EdgeInsets.only(
                  right: index < machines.length - 1 ? 8 : 0,
                ),
                child: InkWell(
                  onTap: () => onMachineSelected(
                    isSelected ? null : machine['id'],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? SMTTheme.primaryRed.withOpacity(0.1)
                          : SMTTheme.lightGrey,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected 
                            ? SMTTheme.primaryRed
                            : SMTTheme.lightGrey2,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            Icon(
                              machine['id'] == 'general' 
                                  ? Icons.support_agent
                                  : Icons.precision_manufacturing,
                              size: 16,
                              color: isSelected 
                                  ? SMTTheme.primaryRed
                                  : SMTTheme.primaryGrey,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                machine['model']!,
                                style: SMTTheme.bodySmall.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: isSelected 
                                      ? SMTTheme.primaryRed
                                      : SMTTheme.primaryBlack,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check_circle,
                                size: 16,
                                color: SMTTheme.primaryRed,
                              ),
                          ],
                        ),
                        
                        const SizedBox(height: 2),
                        
                        Text(
                          machine['serialNumber']!,
                          style: SMTTheme.caption.copyWith(
                            color: SMTTheme.primaryGrey,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}


