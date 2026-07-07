import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/providers/database_provider.dart';

class MachineRegistryScreen extends ConsumerStatefulWidget {
  const MachineRegistryScreen({super.key});

  @override
  ConsumerState<MachineRegistryScreen> createState() => _MachineRegistryScreenState();
}

class _MachineRegistryScreenState extends ConsumerState<MachineRegistryScreen> {
  String _selectedFilter = 'All Models';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final machinesAsync = ref.watch(allMachinesProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Machine Registry'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _exportRegistry(),
            icon: const Icon(Icons.download),
          ),
          IconButton(
            onPressed: () => _showMaintenanceSchedule(),
            icon: const Icon(Icons.schedule),
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
                        'Machine Registry',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Track and manage all registered machines',
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

          // Machine Stats
          Container(
            margin: const EdgeInsets.all(24),
            child: machinesAsync.when(
              data: (machines) => _buildMachineStats(machines),
              loading: () => _buildLoadingStats(),
              error: (error, stack) => _buildErrorStats(error.toString()),
            ),
          ),

          // Search and Filter Bar
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
            padding: const EdgeInsets.all(16),
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
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search machines by model, serial, or customer...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: SMTTheme.lightGrey2,
                    ),
                    onChanged: (value) => setState(() => _searchQuery = value),
                  ),
                ),
                const SizedBox(width: 16),
                DropdownButton<String>(
                  value: _selectedFilter,
                  underline: Container(),
                  items: [
                    'All Models',
                    'SS1510',
                    'S1660',
                    'S1660 Max',
                    'SMT-2000',
                    'SMT-3000',
                    'Fiber Laser',
                    'Press Brake',
                    'Tube Laser'
                  ].map((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _selectedFilter = newValue!;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Machines List
          Expanded(
            child: machinesAsync.when(
              data: (machines) => _buildMachinesList(machines),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _registerNewMachine(),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.add),
        label: const Text('Register Machine'),
      ),
    );
  }

  Widget _buildMachineStats(List machines) {
    final totalMachines = machines.length;
    final activeMachines = machines.where((m) => m.status == 'Active').length;
    final maintenanceDue = machines.where((m) => _isMaintenanceDue(m)).length;
    final warrantyExpired = machines.where((m) => _isWarrantyExpired(m)).length;

    return Row(
      children: [
        Expanded(child: _buildStatCard('Total Machines', totalMachines.toString(), Icons.precision_manufacturing, Colors.blue)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Active', activeMachines.toString(), Icons.check_circle, Colors.green)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Maintenance Due', maintenanceDue.toString(), Icons.build, Colors.orange)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Warranty Expired', warrantyExpired.toString(), Icons.warning, Colors.red)),
      ],
    );
  }

  Widget _buildLoadingStats() {
    return Row(
      children: [
        Expanded(child: _buildLoadingStatCard()),
        const SizedBox(width: 16),
        Expanded(child: _buildLoadingStatCard()),
        const SizedBox(width: 16),
        Expanded(child: _buildLoadingStatCard()),
        const SizedBox(width: 16),
        Expanded(child: _buildLoadingStatCard()),
      ],
    );
  }

  Widget _buildErrorStats(String error) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.error, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(
            'Error loading machine stats',
            style: SMTTheme.heading3.copyWith(color: Colors.red),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: SMTTheme.bodyMedium.copyWith(color: Colors.red),
            textAlign: TextAlign.center,
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
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: SMTTheme.heading1.copyWith(
              fontSize: 24,
              color: SMTTheme.primaryBlack,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: SMTTheme.bodyMedium.copyWith(
              color: SMTTheme.darkGrey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingStatCard() {
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
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 24,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 60,
            height: 16,
            decoration: BoxDecoration(
              color: SMTTheme.lightGrey2,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMachinesList(List machines) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: machines.length,
      itemBuilder: (context, index) => _buildMachineCard(machines[index], index),
    );
  }

  Widget _buildMachineCard(machine, int index) {
    final machineModels = ['SS1510', 'S1660', 'S1660 Max', 'SMT-2000', 'SMT-3000', 'Fiber Laser', 'Press Brake', 'Tube Laser'];
    final model = machineModels[index % machineModels.length];
    final customers = ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'ABC Manufacturing'];
    final customer = customers[index % customers.length];
    final status = index % 4 == 0 ? 'Active' : index % 4 == 1 ? 'Maintenance' : index % 4 == 2 ? 'Inactive' : 'Warranty';
    final statusColor = _getStatusColor(status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
      child: ExpansionTile(
        tilePadding: const EdgeInsets.all(20),
        childrenPadding: const EdgeInsets.all(20),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            Icons.precision_manufacturing,
            color: statusColor,
            size: 24,
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              model,
              style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
            ),
            const SizedBox(height: 4),
            Text(
              'Serial: ${machine.serialNumber ?? 'SMT-${index.toString().padLeft(6, '0')}'}',
              style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'WARRANTY',
                    style: TextStyle(
                      color: Colors.blue,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) => _handleMachineAction(value, machine),
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'view',
              child: ListTile(
                leading: Icon(Icons.visibility),
                title: Text('View Details'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'edit',
              child: ListTile(
                leading: Icon(Icons.edit),
                title: Text('Edit Machine'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'service',
              child: ListTile(
                leading: Icon(Icons.build),
                title: Text('Schedule Service'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'history',
              child: ListTile(
                leading: Icon(Icons.history),
                title: Text('Service History'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: ListTile(
                leading: Icon(Icons.delete, color: Colors.red),
                title: Text('Remove Machine', style: TextStyle(color: Colors.red)),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
        children: [
          // Machine Details
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Machine Information:',
                style: SMTTheme.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: SMTTheme.primaryBlack,
                ),
              ),
              const SizedBox(height: 16),
              
              // Machine Info Grid
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem('Customer', customer),
                  ),
                  Expanded(
                    child: _buildInfoItem('Installation Date', '15/03/2024'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Last Service', '30 days ago'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem('Warranty Expires', '15/03/2025'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Next Maintenance', 'In 45 days'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Total Hours', '${(index + 1) * 250}'),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _scheduleService(machine),
                      icon: const Icon(Icons.schedule),
                      label: const Text('Schedule Service'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SMTTheme.primaryRed,
                        foregroundColor: SMTTheme.primaryWhite,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _viewServiceHistory(machine),
                      icon: const Icon(Icons.history),
                      label: const Text('Service History'),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Quick Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _generateReport(machine),
                      icon: const Icon(Icons.assessment),
                      label: const Text('Generate Report'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _contactCustomer(machine),
                      icon: const Icon(Icons.contact_mail),
                      label: const Text('Contact Customer'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: SMTTheme.bodySmall.copyWith(
            color: SMTTheme.darkGrey,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.primaryBlack),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Colors.green;
      case 'maintenance':
        return Colors.orange;
      case 'inactive':
        return Colors.grey;
      case 'warranty':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  bool _isMaintenanceDue(machine) {
    // Mock logic for maintenance due
    return DateTime.now().day % 3 == 0;
  }

  bool _isWarrantyExpired(machine) {
    // Mock logic for warranty expired
    return DateTime.now().day % 5 == 0;
  }

  void _exportRegistry() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting machine registry...')),
    );
  }

  void _showMaintenanceSchedule() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Showing maintenance schedule...')),
    );
  }

  void _registerNewMachine() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Register new machine - Implementation needed')),
    );
  }

  void _handleMachineAction(String action, machine) {
    switch (action) {
      case 'view':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('View machine details')),
        );
        break;
      case 'edit':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Edit machine information')),
        );
        break;
      case 'service':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Schedule service appointment')),
        );
        break;
      case 'history':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('View service history')),
        );
        break;
      case 'delete':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Remove machine from registry')),
        );
        break;
    }
  }

  void _scheduleService(machine) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Schedule service - Implementation needed')),
    );
  }

  void _viewServiceHistory(machine) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('View service history - Implementation needed')),
    );
  }

  void _generateReport(machine) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Generate machine report')),
    );
  }

  void _contactCustomer(machine) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Contact customer')),
    );
  }
}

