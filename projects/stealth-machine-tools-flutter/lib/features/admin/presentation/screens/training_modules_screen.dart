import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/providers/database_provider.dart';

class TrainingModulesScreen extends ConsumerStatefulWidget {
  const TrainingModulesScreen({super.key});

  @override
  ConsumerState<TrainingModulesScreen> createState() => _TrainingModulesScreenState();
}

class _TrainingModulesScreenState extends ConsumerState<TrainingModulesScreen> {
  String _selectedCategory = 'All Categories';
  String _selectedStatus = 'All Status';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final modulesAsync = ref.watch(allTrainingModulesProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Training Modules'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _exportModules(),
            icon: const Icon(Icons.download),
          ),
          IconButton(
            onPressed: () => _viewProgress(),
            icon: const Icon(Icons.analytics),
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
                        'Training Modules',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Manage machine-specific training content',
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
                    Icons.school,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Training Stats
          Container(
            margin: const EdgeInsets.all(24),
            child: modulesAsync.when(
              data: (modules) => _buildTrainingStats(modules),
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
            child: Column(
              children: [
                // Search Bar
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search training modules...',
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
                // Filter Dropdowns
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
                          'All Categories',
                          'Setup & Installation',
                          'Basic Operations',
                          'Advanced Features',
                          'Maintenance',
                          'Safety Procedures',
                          'Troubleshooting'
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
                        value: _selectedStatus,
                        decoration: const InputDecoration(
                          labelText: 'Status',
                          border: OutlineInputBorder(),
                        ),
                        items: ['All Status', 'Published', 'Draft', 'Archived'].map((String value) {
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
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Training Modules List
          Expanded(
            child: modulesAsync.when(
              data: (modules) => _buildModulesList(modules),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _createNewModule(),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.add),
        label: const Text('Create Module'),
      ),
    );
  }

  Widget _buildTrainingStats(List modules) {
    final totalModules = modules.length;
    final publishedModules = modules.where((m) => m.isPublished == true).length;
    final draftModules = modules.where((m) => m.isPublished == false).length;
    final completionRate = 85; // Mock completion rate

    return Row(
      children: [
        Expanded(child: _buildStatCard('Total Modules', totalModules.toString(), Icons.school, Colors.blue)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Published', publishedModules.toString(), Icons.check_circle, Colors.green)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Drafts', draftModules.toString(), Icons.edit, Colors.orange)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Completion Rate', '$completionRate%', Icons.trending_up, Colors.purple)),
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
            'Error loading training stats',
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

  Widget _buildModulesList(List modules) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: modules.length,
      itemBuilder: (context, index) => _buildModuleCard(modules[index], index),
    );
  }

  Widget _buildModuleCard(module, int index) {
    final moduleTitles = [
      'Machine Setup Fundamentals',
      'Safety Procedures & Protocols',
      'Basic Operations Training',
      'Advanced Feature Guide',
      'Maintenance Procedures',
      'Troubleshooting Guide',
      'Quality Control Methods',
      'Emergency Procedures'
    ];
    final title = moduleTitles[index % moduleTitles.length];
    final categories = ['Setup & Installation', 'Safety Procedures', 'Basic Operations', 'Maintenance'];
    final category = categories[index % categories.length];
    final machines = ['S1660 Max', 'SMT-2000', 'Fiber Laser', 'Press Brake'];
    final machine = machines[index % machines.length];
    final isPublished = index % 3 != 0;
    final duration = (index + 1) * 15;
    final level = ['Beginner', 'Intermediate', 'Advanced'][index % 3];
    
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
            color: Colors.purple.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            isPublished ? Icons.play_circle_filled : Icons.edit,
            color: Colors.purple,
            size: 24,
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
            ),
            const SizedBox(height: 4),
            Text(
              'For $machine • $duration minutes • $level',
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
                    color: isPublished ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isPublished ? 'PUBLISHED' : 'DRAFT',
                    style: TextStyle(
                      color: isPublished ? Colors.green : Colors.orange,
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
          onSelected: (value) => _handleModuleAction(value, module),
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'view',
              child: ListTile(
                leading: Icon(Icons.visibility),
                title: Text('Preview Module'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'edit',
              child: ListTile(
                leading: Icon(Icons.edit),
                title: Text('Edit Module'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'duplicate',
              child: ListTile(
                leading: Icon(Icons.copy),
                title: Text('Duplicate'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'analytics',
              child: ListTile(
                leading: Icon(Icons.analytics),
                title: Text('View Analytics'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'archive',
              child: ListTile(
                leading: Icon(Icons.archive, color: Colors.orange),
                title: Text('Archive', style: TextStyle(color: Colors.orange)),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: ListTile(
                leading: Icon(Icons.delete, color: Colors.red),
                title: Text('Delete', style: TextStyle(color: Colors.red)),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
        children: [
          // Module Details
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Module Overview:',
                style: SMTTheme.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: SMTTheme.primaryBlack,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'This comprehensive training module covers all aspects of $title for the $machine. Students will learn essential skills and best practices through interactive content, videos, and hands-on exercises.',
                style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
              ),
              const SizedBox(height: 16),
              
              // Module Info
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem('Duration', '$duration minutes'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Level', level),
                  ),
                  Expanded(
                    child: _buildInfoItem('Lessons', '${(index + 1) * 3}'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem('Completions', '${(index + 1) * 15}'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Avg. Rating', '4.${(index % 5) + 5}'),
                  ),
                  Expanded(
                    child: _buildInfoItem('Last Updated', '${index + 1} days ago'),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _previewModule(module),
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Preview'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SMTTheme.primaryRed,
                        foregroundColor: SMTTheme.primaryWhite,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _editModule(module),
                      icon: const Icon(Icons.edit),
                      label: const Text('Edit'),
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
                      onPressed: () => _viewAnalytics(module),
                      icon: const Icon(Icons.analytics),
                      label: const Text('Analytics'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _duplicateModule(module),
                      icon: const Icon(Icons.copy),
                      label: const Text('Duplicate'),
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

  void _exportModules() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting training modules...')),
    );
  }

  void _viewProgress() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Viewing training progress analytics...')),
    );
  }

  void _createNewModule() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Create new training module - Implementation needed')),
    );
  }

  void _handleModuleAction(String action, module) {
    switch (action) {
      case 'view':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Preview training module')),
        );
        break;
      case 'edit':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Edit training module')),
        );
        break;
      case 'duplicate':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Duplicate training module')),
        );
        break;
      case 'analytics':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('View module analytics')),
        );
        break;
      case 'archive':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Archive training module')),
        );
        break;
      case 'delete':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Delete training module')),
        );
        break;
    }
  }

  void _previewModule(module) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Preview module - Implementation needed')),
    );
  }

  void _editModule(module) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Edit module - Implementation needed')),
    );
  }

  void _viewAnalytics(module) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('View analytics - Implementation needed')),
    );
  }

  void _duplicateModule(module) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Duplicate module - Implementation needed')),
    );
  }
}

