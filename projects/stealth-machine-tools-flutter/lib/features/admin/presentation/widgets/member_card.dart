import 'package:flutter/material.dart';
import '../../../../core/theme/smt_theme.dart';

class MemberCard extends StatelessWidget {
  final Map<String, dynamic> member;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onToggleAdmin;

  const MemberCard({
    super.key,
    required this.member,
    required this.onEdit,
    required this.onDelete,
    required this.onToggleAdmin,
  });

  @override
  Widget build(BuildContext context) {
    final isAdmin = member['isAdmin'] as bool;
    final type = member['type'] as String;
    final status = member['status'] as String;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: SMTTheme.lightGrey,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAdmin ? SMTTheme.primaryRed.withOpacity(0.3) : SMTTheme.lightGrey2,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _getTypeColor(type).withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Center(
              child: Text(
                member['name'].toString().substring(0, 1).toUpperCase(),
                style: SMTTheme.heading3.copyWith(
                  color: _getTypeColor(type),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),

          // Member Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      member['name'],
                      style: SMTTheme.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                        color: SMTTheme.primaryBlack,
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (isAdmin)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: SMTTheme.primaryRed.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'ADMIN',
                          style: SMTTheme.bodySmall.copyWith(
                            color: SMTTheme.primaryRed,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  member['email'],
                  style: SMTTheme.bodyMedium.copyWith(
                    color: SMTTheme.darkGrey,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _getTypeColor(type).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        type,
                        style: SMTTheme.bodySmall.copyWith(
                          color: _getTypeColor(type),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (member['machine'] != 'N/A')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          member['machine'],
                          style: SMTTheme.bodySmall.copyWith(
                            color: Colors.blue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: status == 'Active' ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status,
                        style: SMTTheme.bodySmall.copyWith(
                          color: status == 'Active' ? Colors.green : Colors.red,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Last active: ${member['lastActive']}',
                  style: SMTTheme.bodySmall.copyWith(
                    color: SMTTheme.lightGrey2,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),

          // Actions
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              switch (value) {
                case 'edit':
                  onEdit();
                  break;
                case 'toggle_admin':
                  onToggleAdmin();
                  break;
                case 'delete':
                  onDelete();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit, size: 16),
                    SizedBox(width: 8),
                    Text('Edit'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'toggle_admin',
                child: Row(
                  children: [
                    Icon(
                      isAdmin ? Icons.remove_moderator : Icons.admin_panel_settings,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(isAdmin ? 'Revoke Admin' : 'Grant Admin'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, size: 16, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'customer':
        return Colors.blue;
      case 'employee':
        return Colors.green;
      case 'admin':
        return SMTTheme.primaryRed;
      default:
        return SMTTheme.darkGrey;
    }
  }
}
