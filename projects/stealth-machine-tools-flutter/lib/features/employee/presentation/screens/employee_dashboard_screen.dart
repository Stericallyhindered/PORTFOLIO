import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/providers/database_provider.dart';

class EmployeeDashboardScreen extends ConsumerStatefulWidget {
  const EmployeeDashboardScreen({super.key});

  @override
  ConsumerState<EmployeeDashboardScreen> createState() => _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState extends ConsumerState<EmployeeDashboardScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(allTicketsProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Employee Dashboard'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _viewKnowledgeBase(),
            icon: const Icon(Icons.library_books),
          ),
          IconButton(
            onPressed: () => _showNotifications(),
            icon: const Icon(Icons.notifications),
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
                        'Employee Portal',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Support customers and manage knowledge',
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
                    Icons.engineering,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Employee Stats
          Container(
            margin: const EdgeInsets.all(24),
            child: ticketsAsync.when(
              data: (tickets) => _buildEmployeeStats(tickets),
              loading: () => _buildLoadingStats(),
              error: (error, stack) => _buildErrorStats(error.toString()),
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
                _buildTabButton('Tickets', 0, Icons.support_agent),
                _buildTabButton('Knowledge', 1, Icons.library_books),
                _buildTabButton('Training', 2, Icons.school),
                _buildTabButton('Tools', 3, Icons.build),
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
        onPressed: () => _captureKnowledge(),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.add),
        label: const Text('Capture Knowledge'),
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

  Widget _buildEmployeeStats(List tickets) {
    final openTickets = tickets.where((t) => t.status.name == 'open').length;
    final myTickets = tickets.length; // Mock data
    final resolvedToday = 3; // Mock data
    final knowledgeEntries = 15; // Mock data

    return Row(
      children: [
        Expanded(child: _buildStatCard('Open Tickets', openTickets.toString(), Icons.support_agent, Colors.orange)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('My Tickets', myTickets.toString(), Icons.assignment, Colors.blue)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Resolved Today', resolvedToday.toString(), Icons.check_circle, Colors.green)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Knowledge Entries', knowledgeEntries.toString(), Icons.library_books, Colors.purple)),
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
            'Error loading dashboard',
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

  Widget _buildContentArea() {
    switch (_selectedTab) {
      case 0:
        return _buildTicketsTab();
      case 1:
        return _buildKnowledgeTab();
      case 2:
        return _buildTrainingTab();
      case 3:
        return _buildToolsTab();
      default:
        return _buildTicketsTab();
    }
  }

  Widget _buildTicketsTab() {
    final ticketsAsync = ref.watch(allTicketsProvider);
    
    return ticketsAsync.when(
      data: (tickets) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Support Tickets',
                  style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
                ),
                DropdownButton<String>(
                  value: 'All Tickets',
                  underline: Container(),
                  items: ['All Tickets', 'My Tickets', 'Open', 'In Progress', 'Resolved'].map((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    // Filter tickets
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: tickets.length,
                itemBuilder: (context, index) => _buildTicketCard(tickets[index], index),
              ),
            ),
          ],
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }

  Widget _buildTicketCard(ticket, int index) {
    final customers = ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'ABC Manufacturing'];
    final customer = customers[index % customers.length];
    final priority = ['Low', 'Medium', 'High', 'Critical'][index % 4];
    final priorityColor = _getPriorityColor(priority);
    final status = ticket.status.name;
    final statusColor = _getStatusColor(status);
    
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
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.support_agent,
                  color: statusColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ticket.title,
                      style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Customer: $customer • Ticket #${ticket.ticketNumber}',
                      style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: priorityColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      priority.toUpperCase(),
                      style: TextStyle(
                        color: priorityColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
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
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            ticket.description,
            style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _takeTicket(ticket),
                  icon: const Icon(Icons.person_add),
                  label: const Text('Take Ticket'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SMTTheme.primaryRed,
                    foregroundColor: SMTTheme.primaryWhite,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _viewTicketDetails(ticket),
                  icon: const Icon(Icons.visibility),
                  label: const Text('View Details'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKnowledgeTab() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Knowledge Base',
                style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
              ),
              ElevatedButton.icon(
                onPressed: () => _addKnowledgeEntry(),
                icon: const Icon(Icons.add),
                label: const Text('Add Entry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: SMTTheme.primaryRed,
                  foregroundColor: SMTTheme.primaryWhite,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              children: [
                _buildKnowledgeEntry('Machine Calibration Process', 'Step-by-step calibration guide for S1660 Max', 'Setup', '2 hours ago'),
                _buildKnowledgeEntry('Common Error Codes', 'Troubleshooting guide for frequent error messages', 'Troubleshooting', '1 day ago'),
                _buildKnowledgeEntry('Maintenance Schedule', 'Recommended maintenance intervals and procedures', 'Maintenance', '2 days ago'),
                _buildKnowledgeEntry('Safety Protocols', 'Updated safety procedures for fiber laser operations', 'Safety', '3 days ago'),
                _buildKnowledgeEntry('Parts Replacement Guide', 'How to replace common wear parts', 'Maintenance', '1 week ago'),
                _buildKnowledgeEntry('Software Update Process', 'Installing latest software updates safely', 'Software', '1 week ago'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKnowledgeEntry(String title, String description, String category, String timeAgo) {
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
                child: const Icon(Icons.library_books, color: Colors.blue, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  category.toUpperCase(),
                  style: TextStyle(
                    color: Colors.green,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.access_time, size: 16, color: SMTTheme.darkGrey),
              const SizedBox(width: 8),
              Text(
                'Updated $timeAgo',
                style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _editKnowledgeEntry(title),
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Edit'),
              ),
              TextButton.icon(
                onPressed: () => _viewKnowledgeEntry(title),
                icon: const Icon(Icons.visibility, size: 16),
                label: const Text('View'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrainingTab() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Employee Training',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              children: [
                _buildTrainingModule('Customer Service Excellence', 'Advanced customer service techniques', 'Professional Development', '4.5', '2 hours'),
                _buildTrainingModule('Technical Troubleshooting', 'Advanced troubleshooting methodologies', 'Technical Skills', '4.8', '3 hours'),
                _buildTrainingModule('Product Knowledge Update', 'Latest machine features and capabilities', 'Product Training', '4.6', '1.5 hours'),
                _buildTrainingModule('Safety Compliance', 'OSHA and workplace safety requirements', 'Safety Training', '4.9', '2.5 hours'),
                _buildTrainingModule('Communication Skills', 'Effective communication with customers', 'Soft Skills', '4.4', '1 hour'),
                _buildTrainingModule('Documentation Best Practices', 'Creating clear and helpful documentation', 'Process Improvement', '4.7', '1.5 hours'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrainingModule(String title, String description, String category, String rating, String duration) {
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
                  color: Colors.purple.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.school, color: Colors.purple, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  category.toUpperCase(),
                  style: TextStyle(
                    color: Colors.blue,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.star, size: 16, color: Colors.orange),
              const SizedBox(width: 4),
              Text(
                rating,
                style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.primaryBlack),
              ),
              const SizedBox(width: 16),
              Icon(Icons.access_time, size: 16, color: SMTTheme.darkGrey),
              const SizedBox(width: 4),
              Text(
                duration,
                style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () => _startTraining(title),
                style: ElevatedButton.styleFrom(
                  backgroundColor: SMTTheme.primaryRed,
                  foregroundColor: SMTTheme.primaryWhite,
                ),
                child: const Text('Start Training'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildToolsTab() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Employee Tools',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              children: [
                _buildToolCard('Remote Diagnostics', 'Connect to customer machines for remote troubleshooting', Icons.router, Colors.blue, () => _openRemoteDiagnostics()),
                _buildToolCard('Parts Lookup', 'Search and identify machine parts quickly', Icons.inventory, Colors.green, () => _openPartsLookup()),
                _buildToolCard('Service History', 'View complete service history for any machine', Icons.history, Colors.orange, () => _openServiceHistory()),
                _buildToolCard('Customer Database', 'Access customer information and machine details', Icons.people, Colors.purple, () => _openCustomerDatabase()),
                _buildToolCard('Warranty Checker', 'Verify warranty status and coverage', Icons.verified, Colors.red, () => _openWarrantyChecker()),
                _buildToolCard('Technical Bulletins', 'Latest technical updates and bulletins', Icons.article, Colors.teal, () => _openTechnicalBulletins()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolCard(String title, String description, IconData icon, Color color, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        title: Text(
          title,
          style: SMTTheme.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
            color: SMTTheme.primaryBlack,
          ),
        ),
        subtitle: Text(
          description,
          style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.yellow;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return Colors.orange;
      case 'in_progress':
        return Colors.blue;
      case 'resolved':
        return Colors.green;
      case 'closed':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  void _viewKnowledgeBase() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('View knowledge base - Implementation needed')),
    );
  }

  void _showNotifications() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Show notifications - Implementation needed')),
    );
  }

  void _captureKnowledge() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Capture knowledge - Implementation needed')),
    );
  }

  void _takeTicket(ticket) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Take ticket - Implementation needed')),
    );
  }

  void _viewTicketDetails(ticket) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('View ticket details - Implementation needed')),
    );
  }

  void _addKnowledgeEntry() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Add knowledge entry - Implementation needed')),
    );
  }

  void _editKnowledgeEntry(String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Edit knowledge entry: $title')),
    );
  }

  void _viewKnowledgeEntry(String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('View knowledge entry: $title')),
    );
  }

  void _startTraining(String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Start training: $title')),
    );
  }

  void _openRemoteDiagnostics() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Open remote diagnostics')),
    );
  }

  void _openPartsLookup() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Open parts lookup')),
    );
  }

  void _openServiceHistory() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Open service history')),
    );
  }

  void _openCustomerDatabase() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Open customer database')),
    );
  }

  void _openWarrantyChecker() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Open warranty checker')),
    );
  }

  void _openTechnicalBulletins() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Open technical bulletins')),
    );
  }
}

