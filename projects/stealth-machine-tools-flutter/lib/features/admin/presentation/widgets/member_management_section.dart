import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/providers/database_provider.dart';
import '../../../../core/models/user_model.dart' as models;
import '../widgets/member_card.dart';
import '../widgets/add_member_dialog.dart';

class MemberManagementSection extends ConsumerStatefulWidget {
  const MemberManagementSection({super.key});

  @override
  ConsumerState<MemberManagementSection> createState() => _MemberManagementSectionState();
}

class _MemberManagementSectionState extends ConsumerState<MemberManagementSection> {
  String _selectedFilter = 'All';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Member Management',
                    style: SMTTheme.heading1.copyWith(
                      color: SMTTheme.primaryBlack,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Manage customers, employees, and admin privileges',
                    style: SMTTheme.bodyLarge.copyWith(
                      color: SMTTheme.darkGrey,
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () => _showAddMemberDialog(),
                icon: const Icon(Icons.person_add),
                label: const Text('Add Member'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: SMTTheme.primaryRed,
                  foregroundColor: SMTTheme.primaryWhite,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Filters and Search
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: SMTTheme.primaryWhite,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Search Bar
                Expanded(
                  flex: 2,
                  child: TextField(
                    onChanged: (value) {
                      // TODO: Implement search functionality
                    },
                    decoration: InputDecoration(
                      hintText: 'Search members...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: SMTTheme.lightGrey2),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: SMTTheme.primaryRed),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Filter Dropdown
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: SMTTheme.lightGrey2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedFilter,
                      items: ['All', 'Customers', 'Employees', 'Admins'].map((filter) {
                        return DropdownMenuItem(
                          value: filter,
                          child: Text(filter),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedFilter = value!;
                        });
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Sort Button
                IconButton(
                  onPressed: () {
                    // TODO: Show sort options
                  },
                  icon: const Icon(Icons.sort),
                  tooltip: 'Sort',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Stats Row
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Total Members', '1,247', Icons.people, Colors.blue),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard('Customers', '1,156', Icons.person, Colors.green),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard('Employees', '78', Icons.badge, Colors.orange),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard('Admins', '13', Icons.admin_panel_settings, Colors.red),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Members List
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: SMTTheme.primaryWhite,
                borderRadius: BorderRadius.circular(12),
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
                    'Members List',
                    style: SMTTheme.heading3.copyWith(
                      color: SMTTheme.primaryBlack,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: _buildMembersList(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SMTTheme.primaryWhite,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: SMTTheme.heading2.copyWith(
                  color: SMTTheme.primaryBlack,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                title,
                style: SMTTheme.bodyMedium.copyWith(
                  color: SMTTheme.darkGrey,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMembersList() {
    // Get real data from database
    final usersAsync = ref.watch(allUsersProvider);

    return usersAsync.when(
      data: (users) {
        if (users.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.people_outline,
                  size: 64,
                  color: SMTTheme.lightGrey2,
                ),
                const SizedBox(height: 16),
                Text(
                  'No members found',
                  style: SMTTheme.heading3.copyWith(
                    color: SMTTheme.darkGrey,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Add your first member to get started',
                  style: SMTTheme.bodyMedium.copyWith(
                    color: SMTTheme.lightGrey2,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          itemCount: users.length,
          itemBuilder: (context, index) {
            final user = users[index];
            final memberData = _convertUserToMemberData(user);
            return MemberCard(
              member: memberData,
              onEdit: () => _editMember(memberData),
              onDelete: () => _deleteMember(memberData),
              onToggleAdmin: () => _toggleAdminPrivileges(memberData),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Text(
          'Error loading members: $error',
          style: TextStyle(color: Colors.red),
        ),
      ),
    );
  }

  Map<String, dynamic> _convertUserToMemberData(models.UserModel user) {
    return {
      'id': user.id,
      'name': user.fullName,
      'email': user.email,
      'type': _getUserTypeDisplayName(user.userType),
      'machine': 'N/A', // Will be populated from machine data
      'isAdmin': user.isAdmin,
      'lastActive': user.lastLogin != null 
          ? _formatLastActive(user.lastLogin!)
          : 'Never',
      'status': user.isActive ? 'Active' : 'Inactive',
    };
  }

  String _getUserTypeDisplayName(models.UserType type) {
    switch (type) {
      case models.UserType.customer:
        return 'Customer';
      case models.UserType.employee:
        return 'Employee';
      case models.UserType.admin:
        return 'Admin';
    }
  }

  String _formatLastActive(DateTime lastLogin) {
    final now = DateTime.now();
    final difference = now.difference(lastLogin);

    if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }

  void _showAddMemberDialog() {
    showDialog(
      context: context,
      builder: (context) => const AddMemberDialog(),
    );
  }

  void _editMember(Map<String, dynamic> member) {
    // TODO: Show edit member dialog
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Edit ${member['name']} - Coming soon')),
    );
  }

  void _deleteMember(Map<String, dynamic> member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Member'),
        content: Text('Are you sure you want to delete ${member['name']}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // TODO: Delete member
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${member['name']} deleted')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _toggleAdminPrivileges(Map<String, dynamic> member) {
    final isAdmin = member['isAdmin'] as bool;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isAdmin ? 'Revoke Admin Privileges' : 'Grant Admin Privileges'),
        content: Text(
          isAdmin
              ? 'Are you sure you want to revoke admin privileges for ${member['name']}?'
              : 'Are you sure you want to grant admin privileges to ${member['name']}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // TODO: Toggle admin privileges
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    isAdmin
                        ? 'Admin privileges revoked for ${member['name']}'
                        : 'Admin privileges granted to ${member['name']}',
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isAdmin ? Colors.orange : SMTTheme.primaryRed,
              foregroundColor: Colors.white,
            ),
            child: Text(isAdmin ? 'Revoke' : 'Grant'),
          ),
        ],
      ),
    );
  }

}
