import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';

class PartsCatalogScreen extends ConsumerStatefulWidget {
  const PartsCatalogScreen({super.key});

  @override
  ConsumerState<PartsCatalogScreen> createState() => _PartsCatalogScreenState();
}

class _PartsCatalogScreenState extends ConsumerState<PartsCatalogScreen> {
  String _selectedCategory = 'All Parts';
  String _selectedMachine = 'All Machines';
  String _searchQuery = '';
  bool _lowStockOnly = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Parts Catalog'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _exportCatalog(),
            icon: const Icon(Icons.download),
          ),
          IconButton(
            onPressed: () => _manageInventory(),
            icon: const Icon(Icons.inventory),
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
                        'Parts Catalog',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Manage machine parts inventory and orders',
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
                    Icons.inventory_2,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Parts Stats
          Container(
            margin: const EdgeInsets.all(24),
            child: _buildPartsStats(),
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
            child: Column(
              children: [
                // Search Bar
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search parts by name, part number, or description...',
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
                const SizedBox(height: 16),
                // Filter Row
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        decoration: const InputDecoration(
                          labelText: 'Category',
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          'All Parts',
                          'Cutting Tools',
                          'Electronics',
                          'Mechanical Parts',
                          'Safety Equipment',
                          'Consumables',
                          'Accessories'
                        ].map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            _selectedCategory = newValue!;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedMachine,
                        decoration: const InputDecoration(
                          labelText: 'Machine',
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          'All Machines',
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
                            _selectedMachine = newValue!;
                          });
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Low Stock Toggle
                Row(
                  children: [
                    Checkbox(
                      value: _lowStockOnly,
                      onChanged: (value) => setState(() => _lowStockOnly = value ?? false),
                      activeColor: SMTTheme.primaryRed,
                    ),
                    const Text('Show low stock items only'),
                    const Spacer(),
                    ElevatedButton.icon(
                      onPressed: () => _createPurchaseOrder(),
                      icon: const Icon(Icons.shopping_cart),
                      label: const Text('Purchase Order'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SMTTheme.primaryRed,
                        foregroundColor: SMTTheme.primaryWhite,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Parts List
          Expanded(
            child: _buildPartsList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _addNewPart(),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.add),
        label: const Text('Add Part'),
      ),
    );
  }

  Widget _buildPartsStats() {
    return Row(
      children: [
        Expanded(child: _buildStatCard('Total Parts', '1,247', Icons.inventory, Colors.blue)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('In Stock', '1,156', Icons.check_circle, Colors.green)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Low Stock', '23', Icons.warning, Colors.orange)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Out of Stock', '68', Icons.error, Colors.red)),
      ],
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

  Widget _buildPartsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: 20,
      itemBuilder: (context, index) => _buildPartCard(index),
    );
  }

  Widget _buildPartCard(int index) {
    final partNames = [
      'Spindle Motor',
      'Cutting Tool Holder',
      'Control Board',
      'Linear Bearing',
      'Safety Switch',
      'Coolant Pump',
      'Stepper Motor',
      'Limit Switch'
    ];
    final partName = partNames[index % partNames.length];
    final partNumbers = ['SMT-P001', 'SMT-P002', 'SMT-P003', 'SMT-P004'];
    final partNumber = partNumbers[index % partNumbers.length];
    final categories = ['Mechanical Parts', 'Electronics', 'Cutting Tools', 'Safety Equipment'];
    final category = categories[index % categories.length];
    final machines = ['S1660 Max', 'SMT-2000', 'Fiber Laser', 'Press Brake'];
    final machine = machines[index % machines.length];
    final stock = (index + 1) * 5;
    final price = 25.99 + (index * 12.50);
    final stockStatus = stock < 10 ? 'Low Stock' : stock < 5 ? 'Critical' : 'In Stock';
    final stockColor = _getStockColor(stockStatus);
    
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
            color: stockColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            Icons.inventory_2,
            color: stockColor,
            size: 24,
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              partName,
              style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
            ),
            const SizedBox(height: 4),
            Text(
              'Part #$partNumber',
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
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: stockColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    stockStatus.toUpperCase(),
                    style: TextStyle(
                      color: stockColor,
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
          onSelected: (value) => _handlePartAction(value, index),
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
                title: Text('Edit Part'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'order',
              child: ListTile(
                leading: Icon(Icons.shopping_cart),
                title: Text('Order Parts'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'history',
              child: ListTile(
                leading: Icon(Icons.history),
                title: Text('Order History'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: ListTile(
                leading: Icon(Icons.delete, color: Colors.red),
                title: Text('Remove Part', style: TextStyle(color: Colors.red)),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
        children: [
          // Part Details
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Part Information:',
                style: SMTTheme.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: SMTTheme.primaryBlack,
                ),
              ),
              const SizedBox(height: 16),
              
              // Part Info Grid
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem('Part Number', partNumber),
                  ),
                  Expanded(
                    child: _buildInfoItem('Current Stock', stock.toString()),
                  ),
                  Expanded(
                    child: _buildInfoItem('Unit Price', '\$${price.toStringAsFixed(2)}'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem('Compatible With', machine),
                  ),
                  Expanded(
                    child: _buildInfoItem('Category', category),
                  ),
                  Expanded(
                    child: _buildInfoItem('Last Ordered', '${index + 5} days ago'),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Stock Alert
              if (stock < 10)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Low stock alert: Only $stock units remaining. Consider reordering.',
                          style: SMTTheme.bodyMedium.copyWith(color: Colors.orange),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: 16),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _orderParts(index),
                      icon: const Icon(Icons.shopping_cart),
                      label: const Text('Order Parts'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SMTTheme.primaryRed,
                        foregroundColor: SMTTheme.primaryWhite,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _viewOrderHistory(index),
                      icon: const Icon(Icons.history),
                      label: const Text('Order History'),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Additional Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _editPart(index),
                      icon: const Icon(Icons.edit),
                      label: const Text('Edit Part'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _generatePartReport(index),
                      icon: const Icon(Icons.assessment),
                      label: const Text('Generate Report'),
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

  Color _getStockColor(String status) {
    switch (status.toLowerCase()) {
      case 'in stock':
        return Colors.green;
      case 'low stock':
        return Colors.orange;
      case 'critical':
        return Colors.red;
      case 'out of stock':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _exportCatalog() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting parts catalog...')),
    );
  }

  void _manageInventory() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening inventory management...')),
    );
  }

  void _createPurchaseOrder() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Create purchase order - Implementation needed')),
    );
  }

  void _addNewPart() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Add new part - Implementation needed')),
    );
  }

  void _handlePartAction(String action, int index) {
    switch (action) {
      case 'view':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('View part details for item $index')),
        );
        break;
      case 'edit':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Edit part $index')),
        );
        break;
      case 'order':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order parts for item $index')),
        );
        break;
      case 'history':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('View order history for item $index')),
        );
        break;
      case 'delete':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Remove part $index')),
        );
        break;
    }
  }

  void _orderParts(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Order parts for item $index')),
    );
  }

  void _viewOrderHistory(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('View order history for item $index')),
    );
  }

  void _editPart(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Edit part $index')),
    );
  }

  void _generatePartReport(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Generate report for part $index')),
    );
  }
}


