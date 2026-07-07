import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';

class SystemSettingsScreen extends ConsumerStatefulWidget {
  const SystemSettingsScreen({super.key});

  @override
  ConsumerState<SystemSettingsScreen> createState() => _SystemSettingsScreenState();
}

class _SystemSettingsScreenState extends ConsumerState<SystemSettingsScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('System Settings'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _saveSettings(),
            icon: const Icon(Icons.save),
          ),
          IconButton(
            onPressed: () => _resetSettings(),
            icon: const Icon(Icons.refresh),
          ),
        ],
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
                        'System Settings',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Configure system preferences and security',
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
                    Icons.settings,
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
                _buildTabButton('General', 0, Icons.settings),
                _buildTabButton('Security', 1, Icons.security),
                _buildTabButton('Notifications', 2, Icons.notifications),
                _buildTabButton('Backup', 3, Icons.backup),
              ],
            ),
          ),

          // Content Area
          Expanded(
            child: _buildContentArea(),
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

  Widget _buildContentArea() {
    switch (_selectedTab) {
      case 0:
        return _buildGeneralSettings();
      case 1:
        return _buildSecuritySettings();
      case 2:
        return _buildNotificationSettings();
      case 3:
        return _buildBackupSettings();
      default:
        return _buildGeneralSettings();
    }
  }

  Widget _buildGeneralSettings() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingsSection(
            'Application Settings',
            [
              _buildSwitchSetting('Dark Mode', 'Enable dark theme for the application', false),
              _buildDropdownSetting('Language', 'English', ['English', 'Spanish', 'French', 'German']),
              _buildDropdownSetting('Timezone', 'UTC-5 (EST)', ['UTC-5 (EST)', 'UTC-6 (CST)', 'UTC-7 (MST)', 'UTC-8 (PST)']),
              _buildNumberSetting('Session Timeout', '30', 'minutes', 'Auto-logout after inactivity'),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Machine Settings',
            [
              _buildSwitchSetting('Auto-detection', 'Automatically detect connected machines', true),
              _buildDropdownSetting('Default Machine', 'S1660 Max', ['S1660 Max', 'SMT-2000', 'Fiber Laser', 'Press Brake']),
              _buildNumberSetting('Maintenance Reminder', '30', 'days', 'Days before maintenance due'),
              _buildSwitchSetting('Service Alerts', 'Send alerts for scheduled maintenance', true),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'User Interface',
            [
              _buildSwitchSetting('Compact Mode', 'Use compact layout for smaller screens', false),
              _buildDropdownSetting('Default View', 'Dashboard', ['Dashboard', 'List View', 'Grid View']),
              _buildSwitchSetting('Animations', 'Enable UI animations and transitions', true),
              _buildNumberSetting('Items Per Page', '25', 'items', 'Default number of items per page'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSecuritySettings() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingsSection(
            'Authentication',
            [
              _buildSwitchSetting('Two-Factor Authentication', 'Require 2FA for admin access', true),
              _buildDropdownSetting('Password Policy', 'Strong', ['Weak', 'Medium', 'Strong', 'Very Strong']),
              _buildNumberSetting('Login Attempts', '5', 'attempts', 'Maximum failed login attempts'),
              _buildNumberSetting('Lockout Duration', '15', 'minutes', 'Account lockout duration'),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Access Control',
            [
              _buildSwitchSetting('IP Whitelist', 'Restrict access to specific IP addresses', false),
              _buildSwitchSetting('Session Management', 'Allow multiple concurrent sessions', true),
              _buildSwitchSetting('Audit Logging', 'Log all admin actions and changes', true),
              _buildDropdownSetting('Encryption Level', 'AES-256', ['AES-128', 'AES-256', 'RSA-2048']),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Data Protection',
            [
              _buildSwitchSetting('Data Encryption', 'Encrypt sensitive data at rest', true),
              _buildSwitchSetting('Secure Backup', 'Encrypt backup files', true),
              _buildDropdownSetting('Retention Policy', '7 years', ['1 year', '3 years', '5 years', '7 years', '10 years']),
              _buildSwitchSetting('GDPR Compliance', 'Enable GDPR compliance features', false),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationSettings() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingsSection(
            'Email Notifications',
            [
              _buildSwitchSetting('System Alerts', 'Receive system alerts via email', true),
              _buildSwitchSetting('Maintenance Reminders', 'Get maintenance reminders', true),
              _buildSwitchSetting('Support Tickets', 'Notify about new support tickets', true),
              _buildSwitchSetting('User Activity', 'Receive user activity reports', false),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Push Notifications',
            [
              _buildSwitchSetting('Mobile Notifications', 'Send push notifications to mobile app', true),
              _buildSwitchSetting('Critical Alerts', 'Immediate notifications for critical issues', true),
              _buildSwitchSetting('Maintenance Alerts', 'Push notifications for maintenance', true),
              _buildSwitchSetting('Training Updates', 'Notify about new training content', false),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Notification Preferences',
            [
              _buildDropdownSetting('Email Frequency', 'Daily', ['Immediate', 'Hourly', 'Daily', 'Weekly']),
              _buildDropdownSetting('Quiet Hours', '10 PM - 6 AM', ['Off', '10 PM - 6 AM', '11 PM - 7 AM', 'Custom']),
              _buildSwitchSetting('Weekend Notifications', 'Send notifications on weekends', false),
              _buildTextSetting('Admin Email', 'admin@stealthmachinetools.com', 'Primary admin email address'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBackupSettings() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingsSection(
            'Backup Configuration',
            [
              _buildSwitchSetting('Auto Backup', 'Automatically backup system data', true),
              _buildDropdownSetting('Backup Frequency', 'Daily', ['Hourly', 'Daily', 'Weekly', 'Monthly']),
              _buildDropdownSetting('Backup Time', '2:00 AM', ['12:00 AM', '2:00 AM', '4:00 AM', '6:00 AM']),
              _buildNumberSetting('Retention Period', '30', 'days', 'Keep backups for specified days'),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Storage Settings',
            [
              _buildDropdownSetting('Backup Location', 'Local Storage', ['Local Storage', 'Cloud Storage', 'Network Drive']),
              _buildSwitchSetting('Compression', 'Compress backup files', true),
              _buildSwitchSetting('Encryption', 'Encrypt backup files', true),
              _buildNumberSetting('Max Backup Size', '10', 'GB', 'Maximum size per backup file'),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Recovery Options',
            [
              _buildSwitchSetting('Point-in-Time Recovery', 'Enable point-in-time recovery', true),
              _buildNumberSetting('Recovery Points', '7', 'points', 'Number of recovery points to keep'),
              _buildSwitchSetting('Test Restore', 'Regularly test backup restoration', false),
              _buildButtonSetting('Test Backup Now', 'Run a test backup to verify configuration', () => _testBackup()),
            ],
          ),
          const SizedBox(height: 24),
          _buildSettingsSection(
            'Backup Status',
            [
              _buildStatusSetting('Last Backup', '2 hours ago', Icons.check_circle, Colors.green),
              _buildStatusSetting('Next Backup', 'In 22 hours', Icons.schedule, Colors.blue),
              _buildStatusSetting('Backup Size', '2.3 GB', Icons.storage, Colors.orange),
              _buildStatusSetting('Storage Used', '45%', Icons.pie_chart, Colors.purple),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> settings) {
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
          Text(
            title,
            style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          ...settings,
        ],
      ),
    );
  }

  Widget _buildSwitchSetting(String title, String description, bool value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: SMTTheme.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: SMTTheme.primaryBlack,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: (newValue) => _updateSetting(title, newValue),
            activeColor: SMTTheme.primaryRed,
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownSetting(String title, String value, List<String> options) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: SMTTheme.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: SMTTheme.primaryBlack,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: value,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: options.map((String option) {
              return DropdownMenuItem<String>(
                value: option,
                child: Text(option),
              );
            }).toList(),
            onChanged: (String? newValue) => _updateSetting(title, newValue),
          ),
        ],
      ),
    );
  }

  Widget _buildNumberSetting(String title, String value, String unit, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: SMTTheme.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: SMTTheme.primaryBlack,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  initialValue: value,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (newValue) => _updateSetting(title, newValue),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                unit,
                style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextSetting(String title, String value, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: SMTTheme.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: SMTTheme.primaryBlack,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
          ),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: value,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            onChanged: (newValue) => _updateSetting(title, newValue),
          ),
        ],
      ),
    );
  }

  Widget _buildButtonSetting(String title, String description, VoidCallback onPressed) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: SMTTheme.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: SMTTheme.primaryBlack,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: SMTTheme.primaryRed,
              foregroundColor: SMTTheme.primaryWhite,
            ),
            child: Text(title),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusSetting(String title, String value, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: SMTTheme.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: SMTTheme.primaryBlack,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: SMTTheme.bodyMedium.copyWith(color: color),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _updateSetting(String setting, dynamic value) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Updated $setting: $value')),
    );
  }

  void _saveSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Settings saved successfully')),
    );
  }

  void _resetSettings() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Settings'),
        content: const Text('Are you sure you want to reset all settings to default values?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Settings reset to default')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
  }

  void _testBackup() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Running test backup...')),
    );
  }
}


