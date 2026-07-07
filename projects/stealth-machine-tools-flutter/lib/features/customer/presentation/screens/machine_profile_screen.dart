import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';

class MachineProfileScreen extends ConsumerStatefulWidget {
  final String machineId;
  
  const MachineProfileScreen({super.key, required this.machineId});

  @override
  ConsumerState<MachineProfileScreen> createState() => _MachineProfileScreenState();
}

class _MachineProfileScreenState extends ConsumerState<MachineProfileScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Machine Profile'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _editMachine(),
            icon: const Icon(Icons.edit),
          ),
          IconButton(
            onPressed: () => _shareMachine(),
            icon: const Icon(Icons.share),
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
                        'S1660 Max Fiber Laser',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Serial: SMT-1660-2024-001',
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
                    Icons.precision_manufacturing,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Machine Status Card
          Container(
            margin: const EdgeInsets.all(24),
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
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildStatusCard('Status', 'Active', Icons.check_circle, Colors.green),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatusCard('Warranty', 'Valid', Icons.verified, Colors.blue),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatusCard('Next Service', '45 days', Icons.schedule, Colors.orange),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatusCard('Total Hours', '1,247', Icons.timer, Colors.purple),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatusCard('Last Service', '30 days ago', Icons.build, Colors.teal),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatusCard('Efficiency', '94%', Icons.trending_up, Colors.green),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Tab Navigation
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
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
                _buildTabButton('Overview', 0, Icons.info),
                _buildTabButton('Service', 1, Icons.build),
                _buildTabButton('History', 2, Icons.history),
                _buildTabButton('Settings', 3, Icons.settings),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Content Area
          Expanded(
            child: _buildContentArea(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _requestService(),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.build),
        label: const Text('Request Service'),
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

  Widget _buildStatusCard(String title, String value, IconData icon, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: SMTTheme.bodyMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: SMTTheme.primaryBlack,
          ),
        ),
        Text(
          title,
          style: SMTTheme.bodySmall.copyWith(
            color: SMTTheme.darkGrey,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildContentArea() {
    switch (_selectedTab) {
      case 0:
        return _buildOverviewTab();
      case 1:
        return _buildServiceTab();
      case 2:
        return _buildHistoryTab();
      case 3:
        return _buildSettingsTab();
      default:
        return _buildOverviewTab();
    }
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard(
            'Machine Specifications',
            [
              _buildSpecItem('Model', 'S1660 Max Fiber Laser'),
              _buildSpecItem('Serial Number', 'SMT-1660-2024-001'),
              _buildSpecItem('Manufacturing Date', 'January 15, 2024'),
              _buildSpecItem('Installation Date', 'February 1, 2024'),
              _buildSpecItem('Warranty Expiry', 'January 15, 2025'),
              _buildSpecItem('Power Rating', '6kW Fiber Laser'),
              _buildSpecItem('Cutting Area', '1600mm x 600mm'),
              _buildSpecItem('Max Material Thickness', '25mm Steel'),
            ],
          ),
          const SizedBox(height: 24),
          _buildSectionCard(
            'Performance Metrics',
            [
              _buildMetricItem('Uptime', '94.2%', Colors.green),
              _buildMetricItem('Efficiency', '87.5%', Colors.blue),
              _buildMetricItem('Quality Score', '96.8%', Colors.purple),
              _buildMetricItem('Energy Usage', '4.2 kW/h', Colors.orange),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildServiceTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard(
            'Service Schedule',
            [
              _buildServiceItem('Next Routine Service', 'March 15, 2024', 'Routine maintenance and inspection', Colors.blue),
              _buildServiceItem('Filter Replacement', 'April 1, 2024', 'Replace air and coolant filters', Colors.orange),
              _buildServiceItem('Laser Calibration', 'May 15, 2024', 'Annual laser alignment and calibration', Colors.purple),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard(
            'Service History',
            [
              _buildHistoryItem('Routine Maintenance', 'February 15, 2024', 'Completed successfully', Colors.green),
              _buildHistoryItem('Filter Replacement', 'January 20, 2024', 'Air and coolant filters replaced', Colors.blue),
              _buildHistoryItem('Software Update', 'January 5, 2024', 'Firmware updated to v2.1.3', Colors.purple),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard(
            'Machine Settings',
            [
              _buildSettingItem('Auto Shutdown', 'Enabled', true, () => _toggleAutoShutdown()),
              _buildSettingItem('Energy Saving Mode', 'Enabled', true, () => _toggleEnergySaving()),
              _buildSettingItem('Maintenance Alerts', 'Enabled', true, () => _toggleMaintenanceAlerts()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
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
          ...children,
        ],
      ),
    );
  }

  Widget _buildSpecItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: SMTTheme.bodyMedium.copyWith(
                color: SMTTheme.darkGrey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.primaryBlack),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: SMTTheme.bodyMedium.copyWith(
                color: SMTTheme.darkGrey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              value,
              style: SMTTheme.bodyMedium.copyWith(
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceItem(String title, String date, String description, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.schedule, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: SMTTheme.bodyMedium.copyWith(
                    color: SMTTheme.primaryBlack,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                Text(
                  date,
                  style: SMTTheme.bodyMedium.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryItem(String title, String date, String description, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: SMTTheme.bodyMedium.copyWith(
                    color: SMTTheme.primaryBlack,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  description,
                  style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
                ),
              ],
            ),
          ),
          Text(
            date,
            style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingItem(String title, String subtitle, bool value, VoidCallback onToggle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: SMTTheme.bodyMedium.copyWith(
                    color: SMTTheme.primaryBlack,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: (newValue) => onToggle(),
            activeColor: SMTTheme.primaryRed,
          ),
        ],
      ),
    );
  }

  void _editMachine() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Edit machine - Implementation needed')),
    );
  }

  void _shareMachine() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share machine info')),
    );
  }

  void _requestService() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Request service - Implementation needed')),
    );
  }

  void _toggleAutoShutdown() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Toggle auto shutdown')),
    );
  }

  void _toggleEnergySaving() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Toggle energy saving mode')),
    );
  }

  void _toggleMaintenanceAlerts() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Toggle maintenance alerts')),
    );
  }
}

