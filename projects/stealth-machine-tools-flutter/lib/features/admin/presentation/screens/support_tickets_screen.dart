import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/providers/database_provider.dart';

class SupportTicketsScreen extends ConsumerStatefulWidget {
  const SupportTicketsScreen({super.key});

  @override
  ConsumerState<SupportTicketsScreen> createState() => _SupportTicketsScreenState();
}

class _SupportTicketsScreenState extends ConsumerState<SupportTicketsScreen> {
  String _selectedFilter = 'All';
  String _selectedStatus = 'All';

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(allTicketsProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Support Tickets'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _showFilterDialog(),
            icon: const Icon(Icons.filter_list),
          ),
          IconButton(
            onPressed: () => _exportTickets(),
            icon: const Icon(Icons.download),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header with Stats
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
                        'Support Tickets',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Manage customer support requests and issues',
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
                    Icons.support_agent,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Stats Cards
          Container(
            margin: const EdgeInsets.all(24),
            child: ticketsAsync.when(
              data: (tickets) => _buildTicketStats(tickets),
              loading: () => _buildLoadingStats(),
              error: (error, stack) => _buildErrorStats(error.toString()),
            ),
          ),

          // Filter Bar
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
                  child: DropdownButtonFormField<String>(
                    value: _selectedFilter,
                    decoration: const InputDecoration(
                      labelText: 'Filter by',
                      border: OutlineInputBorder(),
                    ),
                    items: ['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((String value) {
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
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedStatus,
                    decoration: const InputDecoration(
                      labelText: 'Priority',
                      border: OutlineInputBorder(),
                    ),
                    items: ['All', 'Critical', 'High', 'Medium', 'Low'].map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (String? newValue) {
                      setState(() {
                        _selectedStatus = newValue!;
                      });
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Tickets List
          Expanded(
            child: ticketsAsync.when(
              data: (tickets) => _buildTicketsList(tickets),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _createNewTicket(),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
      ),
    );
  }

  Widget _buildTicketStats(List tickets) {
    final openTickets = tickets.where((t) => t.status.name == 'open').length;
    final inProgressTickets = tickets.where((t) => t.status.name == 'in_progress').length;
    final resolvedTickets = tickets.where((t) => t.status.name == 'resolved').length;
    final criticalTickets = tickets.where((t) => t.priority.name == 'critical').length;

    return Row(
      children: [
        Expanded(child: _buildStatCard('Open', openTickets.toString(), Icons.pending, Colors.orange)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('In Progress', inProgressTickets.toString(), Icons.hourglass_empty, Colors.blue)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Resolved', resolvedTickets.toString(), Icons.check_circle, Colors.green)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Critical', criticalTickets.toString(), Icons.warning, Colors.red)),
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
            'Error loading ticket stats',
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

  Widget _buildTicketsList(List tickets) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: tickets.length,
      itemBuilder: (context, index) => _buildTicketCard(tickets[index], index),
    );
  }

  Widget _buildTicketCard(ticket, int index) {
    final statusColor = _getStatusColor(ticket.status.name);
    final priorityColor = _getPriorityColor(ticket.priority.name);
    
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
            _getStatusIcon(ticket.status.name),
            color: statusColor,
            size: 24,
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              ticket.title,
              style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
            ),
            const SizedBox(height: 4),
            Text(
              'Ticket #${ticket.ticketNumber}',
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
                    ticket.status.name.toUpperCase(),
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
                    color: priorityColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    ticket.priority.name.toUpperCase(),
                    style: TextStyle(
                      color: priorityColor,
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
          onSelected: (value) => _handleTicketAction(value, ticket),
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
                title: Text('Edit Ticket'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'assign',
              child: ListTile(
                leading: Icon(Icons.person_add),
                title: Text('Assign Agent'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'close',
              child: ListTile(
                leading: Icon(Icons.close, color: Colors.red),
                title: Text('Close Ticket', style: TextStyle(color: Colors.red)),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
        children: [
          // Ticket Details
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Description:',
                style: SMTTheme.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: SMTTheme.primaryBlack,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                ticket.description,
                style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
              ),
              const SizedBox(height: 16),
              
              // Ticket Info
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem('Customer', 'John Smith'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Machine', 'S1660 Max'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Created', _formatDate(ticket.createdAt)),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _respondToTicket(ticket),
                      icon: const Icon(Icons.reply),
                      label: const Text('Respond'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SMTTheme.primaryRed,
                        foregroundColor: SMTTheme.primaryWhite,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _viewHistory(ticket),
                      icon: const Icon(Icons.history),
                      label: const Text('History'),
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

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return Icons.pending;
      case 'in_progress':
        return Icons.hourglass_empty;
      case 'resolved':
        return Icons.check_circle;
      case 'closed':
        return Icons.close;
      default:
        return Icons.info;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Tickets'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Advanced filtering options coming soon'),
          ],
        ),
      ),
    );
  }

  void _exportTickets() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting tickets...')),
    );
  }

  void _createNewTicket() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Create new ticket - Implementation needed')),
    );
  }

  void _handleTicketAction(String action, ticket) {
    switch (action) {
      case 'view':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('View ticket ${ticket.ticketNumber}')),
        );
        break;
      case 'edit':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Edit ticket ${ticket.ticketNumber}')),
        );
        break;
      case 'assign':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Assign ticket ${ticket.ticketNumber}')),
        );
        break;
      case 'close':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Close ticket ${ticket.ticketNumber}')),
        );
        break;
    }
  }

  void _respondToTicket(ticket) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Respond to ticket ${ticket.ticketNumber}')),
    );
  }

  void _viewHistory(ticket) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('View history for ticket ${ticket.ticketNumber}')),
    );
  }
}

