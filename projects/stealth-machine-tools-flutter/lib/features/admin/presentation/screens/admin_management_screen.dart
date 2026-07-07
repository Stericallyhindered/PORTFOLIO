import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/providers/database_provider.dart';
import '../../../../core/models/user_model.dart' as models;

class AdminManagementScreen extends ConsumerStatefulWidget {
  const AdminManagementScreen({super.key});

  @override
  ConsumerState<AdminManagementScreen> createState() => _AdminManagementScreenState();
}

class _AdminManagementScreenState extends ConsumerState<AdminManagementScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(allUsersProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Admin Management'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: SMTTheme.darkHeaderGradient,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
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
                        'Admin Management',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Manage admin privileges and system permissions',
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
                    Icons.admin_panel_settings,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Tab Navigation
          Container(
            margin: const EdgeInsets.all(24),
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
            child: Row(
              children: [
                _buildTabButton('Admin Users', 0, Icons.admin_panel_settings),
                _buildTabButton('Permissions', 1, Icons.security),
                _buildTabButton('Access Logs', 2, Icons.history),
                _buildTabButton('System Settings', 3, Icons.settings),
              ],
            ),
          ),

          // Content Area
          Expanded(
            child: _buildContentArea(usersAsync),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String title, int index, IconData icon) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isSelected ? SMTTheme.primaryRed : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? SMTTheme.primaryWhite : SMTTheme.darkGrey,
                size: 24,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: SMTTheme.bodyMedium.copyWith(
                  color: isSelected ? SMTTheme.primaryWhite : SMTTheme.darkGrey,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContentArea(AsyncValue usersAsync) {
    switch (_selectedTab) {
      case 0:
        return _buildAdminUsers(usersAsync);
      case 1:
        return _buildPermissions();
      case 2:
        return _buildAccessLogs();
      case 3:
        return _buildSystemSettings();
      default:
        return _buildAdminUsers(usersAsync);
    }
  }

  Widget _buildAdminUsers(AsyncValue usersAsync) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Admin Stats
          Container(
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
            child: Row(
              children: [
                Expanded(
                  child: _buildStatCard('Total Admins', '5', Icons.admin_panel_settings, Colors.red),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildStatCard('Active Sessions', '3', Icons.people, Colors.blue),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildStatCard('Last Login', '2h ago', Icons.access_time, Colors.green),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Admin Users List
          Expanded(
            child: usersAsync.when(
              data: (users) => _buildAdminUsersList(users),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: SMTTheme.heading2.copyWith(color: color, fontWeight: FontWeight.bold),
          ),
          Text(
            title,
            style: SMTTheme.bodySmall.copyWith(color: color),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAdminUsersList(List<models.UserModel> users) {
    final adminUsers = users.where((user) => user.userType == models.UserType.admin).toList();
    
    return ListView.builder(
      itemCount: adminUsers.length,
      itemBuilder: (context, index) => _buildAdminUserCard(adminUsers[index], index),
    );
  }

  Widget _buildAdminUserCard(models.UserModel user, int index) {
    final isOnline = index % 3 == 0; // Mock online status
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
            children: [
              Stack(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: SMTTheme.primaryRed.withOpacity(0.1),
                    child: Text(
                      user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : 'A',
                      style: TextStyle(
                        color: SMTTheme.primaryRed,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: isOnline ? Colors.green : Colors.grey,
                        shape: BoxShape.circle,
                        border: Border.all(color: SMTTheme.primaryWhite, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.fullName,
                      style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email,
                      style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: SMTTheme.primaryRed.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'ADMIN',
                            style: TextStyle(
                              color: SMTTheme.primaryRed,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          isOnline ? 'Online' : 'Offline',
                          style: TextStyle(
                            color: isOnline ? Colors.green : Colors.grey,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (value) => _handleAdminAction(value, user),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: ListTile(
                      leading: Icon(Icons.edit),
                      title: Text('Edit Permissions'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'suspend',
                    child: ListTile(
                      leading: Icon(Icons.pause_circle),
                      title: Text('Suspend Access'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'logs',
                    child: ListTile(
                      leading: Icon(Icons.history),
                      title: Text('View Activity'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'remove',
                    child: ListTile(
                      leading: Icon(Icons.remove_circle, color: Colors.red),
                      title: Text('Remove Admin', style: TextStyle(color: Colors.red)),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Permissions
          Text(
            'Permissions:',
            style: SMTTheme.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: SMTTheme.primaryBlack,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              'User Management', 'Content Management', 'System Settings',
              'Analytics', 'Support Tickets', 'Training Modules'
            ].map((permission) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                permission,
                style: TextStyle(
                  color: Colors.blue,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )).toList(),
          ),
          
          const SizedBox(height: 16),
          
          // Last Activity
          Row(
            children: [
              Icon(Icons.access_time, size: 16, color: SMTTheme.darkGrey),
              const SizedBox(width: 8),
              Text(
                'Last active: ${_formatTimeAgo(user.createdAt)}',
                style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
              ),
              const Spacer(),
              if (index == 0) // First admin is main admin
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'MAIN ADMIN',
                    style: TextStyle(
                      color: Colors.orange,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPermissions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Permission Management',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: 8,
              itemBuilder: (context, index) => _buildPermissionCard(index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionCard(int index) {
    final permissions = [
      'User Management',
      'Content Management',
      'System Settings',
      'Analytics Access',
      'Support Tickets',
      'Training Modules',
      'Machine Registry',
      'Parts Catalog'
    ];
    final permission = permissions[index];
    final description = [
      'Create, edit, and delete user accounts',
      'Manage knowledge base and training content',
      'Configure system settings and preferences',
      'View analytics and reporting data',
      'Handle support tickets and customer issues',
      'Create and manage training modules',
      'Register and manage machine information',
      'Manage parts catalog and inventory'
    ][index];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: SMTTheme.primaryRed.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.security,
                  color: SMTTheme.primaryRed,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      permission,
                      style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                    ),
                  ],
                ),
              ),
              Switch(
                value: true,
                onChanged: (value) => _togglePermission(permission, value),
                activeColor: SMTTheme.primaryRed,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text(
                'Assigned to: ',
                style: SMTTheme.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: SMTTheme.primaryBlack,
                ),
              ),
              Text(
                '${index + 2} admins',
                style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => _managePermission(permission),
                icon: const Icon(Icons.settings, color: SMTTheme.darkGrey),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAccessLogs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Admin Access Logs',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: 20,
              itemBuilder: (context, index) => _buildAccessLogItem(index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccessLogItem(int index) {
    final actions = ['Login', 'Logout', 'Edit User', 'Create Content', 'System Settings'];
    final action = actions[index % actions.length];
    final admins = ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'Admin User'];
    final admin = admins[index % admins.length];
    final time = DateTime.now().subtract(Duration(hours: index));

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: SMTTheme.primaryWhite,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _getActionColor(action).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getActionIcon(action),
              color: _getActionColor(action),
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$admin performed $action',
                  style: SMTTheme.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: SMTTheme.primaryBlack,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatTimeAgo(time),
                  style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Success',
              style: TextStyle(
                color: Colors.green,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemSettings() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'System Configuration',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: 6,
              itemBuilder: (context, index) => _buildSystemSettingItem(index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemSettingItem(int index) {
    final settings = [
      'Auto-backup System',
      'Email Notifications',
      'Two-Factor Authentication',
      'Session Timeout',
      'Audit Logging',
      'Maintenance Mode'
    ];
    final setting = settings[index];
    final descriptions = [
      'Automatically backup system data daily',
      'Send email notifications for system events',
      'Require 2FA for admin access',
      'Auto-logout after 30 minutes of inactivity',
      'Log all admin actions and changes',
      'Enable maintenance mode for system updates'
    ];
    final description = descriptions[index];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.settings, color: Colors.blue, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      setting,
                      style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                    ),
                  ],
                ),
              ),
              Switch(
                value: index % 2 == 0,
                onChanged: (value) => _toggleSystemSetting(setting, value),
                activeColor: SMTTheme.primaryRed,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getActionColor(String action) {
    switch (action) {
      case 'Login':
        return Colors.green;
      case 'Logout':
        return Colors.orange;
      case 'Edit User':
        return Colors.blue;
      case 'Create Content':
        return Colors.purple;
      case 'System Settings':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getActionIcon(String action) {
    switch (action) {
      case 'Login':
        return Icons.login;
      case 'Logout':
        return Icons.logout;
      case 'Edit User':
        return Icons.edit;
      case 'Create Content':
        return Icons.add;
      case 'System Settings':
        return Icons.settings;
      default:
        return Icons.info;
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

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

  void _handleAdminAction(String action, models.UserModel user) {
    switch (action) {
      case 'edit':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Edit permissions for ${user.fullName}')),
        );
        break;
      case 'suspend':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Suspend access for ${user.fullName}')),
        );
        break;
      case 'logs':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('View activity logs for ${user.fullName}')),
        );
        break;
      case 'remove':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Remove admin privileges for ${user.fullName}')),
        );
        break;
    }
  }

  void _togglePermission(String permission, bool value) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Toggle $permission: $value')),
    );
  }

  void _managePermission(String permission) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Manage $permission')),
    );
  }

  void _toggleSystemSetting(String setting, bool value) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Toggle $setting: $value')),
    );
  }
}


