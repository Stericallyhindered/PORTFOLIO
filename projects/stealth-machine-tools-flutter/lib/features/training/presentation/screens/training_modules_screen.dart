import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';

class TrainingModulesScreen extends ConsumerStatefulWidget {
  const TrainingModulesScreen({super.key});

  @override
  ConsumerState<TrainingModulesScreen> createState() => _TrainingModulesScreenState();
}

class _TrainingModulesScreenState extends ConsumerState<TrainingModulesScreen> {
  String _selectedCategory = 'All Categories';
  String _selectedLevel = 'All Levels';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Training Modules'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _viewProgress(),
            icon: const Icon(Icons.analytics),
          ),
          IconButton(
            onPressed: () => _downloadOffline(),
            icon: const Icon(Icons.download),
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
                        'Training Center',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Master your SMT machine operations',
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

          // Progress Overview
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
                Text(
                  'Your Learning Progress',
                  style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildProgressCard('Completed', '8', 'modules', Colors.green, 0.8),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildProgressCard('In Progress', '3', 'modules', Colors.orange, 0.4),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildProgressCard('Available', '12', 'modules', Colors.blue, 0.0),
                    ),
                  ],
                ),
              ],
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
                        value: _selectedLevel,
                        decoration: const InputDecoration(
                          labelText: 'Level',
                          border: OutlineInputBorder(),
                        ),
                        items: ['All Levels', 'Beginner', 'Intermediate', 'Advanced'].map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            _selectedLevel = newValue!;
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
            child: _buildModulesList(),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressCard(String title, String value, String subtitle, Color color, double progress) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Text(
                value,
                style: SMTTheme.heading1.copyWith(
                  fontSize: 32,
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                subtitle,
                style: SMTTheme.bodySmall.copyWith(color: color),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: SMTTheme.bodyMedium.copyWith(
            color: SMTTheme.primaryBlack,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Container(
          width: 60,
          height: 4,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(2),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: progress,
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildModulesList() {
    final trainingModules = [
      _TrainingModule(
        title: 'Machine Setup Fundamentals',
        description: 'Learn the essential steps to properly set up your SMT machine for optimal performance.',
        category: 'Setup & Installation',
        level: 'Beginner',
        duration: 30,
        progress: 100,
        isCompleted: true,
        machineModel: 'S1660 Max',
        lessons: 5,
        rating: 4.8,
      ),
      _TrainingModule(
        title: 'Safety Procedures & Protocols',
        description: 'Comprehensive safety training covering ANSI/OSHA compliance and best practices.',
        category: 'Safety Procedures',
        level: 'Beginner',
        duration: 45,
        progress: 100,
        isCompleted: true,
        machineModel: 'All Models',
        lessons: 7,
        rating: 4.9,
      ),
      _TrainingModule(
        title: 'Basic Operations Training',
        description: 'Master the fundamental operations of your machine with hands-on exercises.',
        category: 'Basic Operations',
        level: 'Beginner',
        duration: 60,
        progress: 75,
        isCompleted: false,
        machineModel: 'S1660 Max',
        lessons: 8,
        rating: 4.7,
      ),
      _TrainingModule(
        title: 'Advanced Feature Guide',
        description: 'Explore advanced capabilities and techniques for experienced operators.',
        category: 'Advanced Features',
        level: 'Advanced',
        duration: 90,
        progress: 0,
        isCompleted: false,
        machineModel: 'S1660 Max',
        lessons: 12,
        rating: 4.6,
      ),
      _TrainingModule(
        title: 'Maintenance Procedures',
        description: 'Keep your machine running smoothly with proper maintenance routines.',
        category: 'Maintenance',
        level: 'Intermediate',
        duration: 45,
        progress: 40,
        isCompleted: false,
        machineModel: 'All Models',
        lessons: 6,
        rating: 4.8,
      ),
      _TrainingModule(
        title: 'Troubleshooting Guide',
        description: 'Learn to identify and resolve common machine issues independently.',
        category: 'Troubleshooting',
        level: 'Intermediate',
        duration: 75,
        progress: 0,
        isCompleted: false,
        machineModel: 'All Models',
        lessons: 10,
        rating: 4.5,
      ),
    ];

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: trainingModules.length,
      itemBuilder: (context, index) => _buildModuleCard(trainingModules[index], index),
    );
  }

  Widget _buildModuleCard(_TrainingModule module, int index) {
    final levelColor = _getLevelColor(module.level);
    final categoryColor = _getCategoryColor(module.category);
    
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
            color: module.isCompleted ? Colors.green.withOpacity(0.1) : Colors.purple.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            module.isCompleted ? Icons.check_circle : Icons.play_circle_outline,
            color: module.isCompleted ? Colors.green : Colors.purple,
            size: 24,
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              module.title,
              style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
            ),
            const SizedBox(height: 4),
            Text(
              '${module.duration} min • ${module.lessons} lessons • ${module.machineModel}',
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
                    color: categoryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    module.category.toUpperCase(),
                    style: TextStyle(
                      color: categoryColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: levelColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    module.level.toUpperCase(),
                    style: TextStyle(
                      color: levelColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(Icons.star, color: Colors.orange, size: 16),
                const SizedBox(width: 4),
                Text(
                  module.rating.toString(),
                  style: SMTTheme.bodyMedium.copyWith(
                    color: SMTTheme.primaryBlack,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${module.progress}%',
              style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
            ),
          ],
        ),
        children: [
          // Module Details
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                module.description,
                style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
              ),
              const SizedBox(height: 16),
              
              // Progress Bar
              if (module.progress > 0) ...[
                Row(
                  children: [
                    Text(
                      'Progress: ',
                      style: SMTTheme.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                        color: SMTTheme.primaryBlack,
                      ),
                    ),
                    Expanded(
                      child: LinearProgressIndicator(
                        value: module.progress / 100,
                        backgroundColor: SMTTheme.lightGrey2,
                        valueColor: AlwaysStoppedAnimation<Color>(SMTTheme.primaryRed),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${module.progress}%',
                      style: SMTTheme.bodyMedium.copyWith(
                        color: SMTTheme.primaryBlack,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
              
              // Module Stats
              Row(
                children: [
                  Expanded(
                    child: _buildModuleStat('Duration', '${module.duration} min', Icons.access_time),
                  ),
                  Expanded(
                    child: _buildModuleStat('Lessons', '${module.lessons}', Icons.menu_book),
                  ),
                  Expanded(
                    child: _buildModuleStat('Rating', module.rating.toString(), Icons.star),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _startModule(module),
                      icon: Icon(module.isCompleted ? Icons.replay : Icons.play_arrow),
                      label: Text(module.isCompleted ? 'Retake' : 'Start Training'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SMTTheme.primaryRed,
                        foregroundColor: SMTTheme.primaryWhite,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _previewModule(module),
                      icon: const Icon(Icons.visibility),
                      label: const Text('Preview'),
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

  Widget _buildModuleStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: SMTTheme.primaryRed, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: SMTTheme.bodyMedium.copyWith(
            color: SMTTheme.primaryBlack,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
        ),
      ],
    );
  }

  Color _getLevelColor(String level) {
    switch (level.toLowerCase()) {
      case 'beginner':
        return Colors.green;
      case 'intermediate':
        return Colors.orange;
      case 'advanced':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'setup & installation':
        return Colors.blue;
      case 'basic operations':
        return Colors.green;
      case 'advanced features':
        return Colors.purple;
      case 'maintenance':
        return Colors.orange;
      case 'safety procedures':
        return Colors.red;
      case 'troubleshooting':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  void _viewProgress() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('View training progress analytics')),
    );
  }

  void _downloadOffline() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Download modules for offline access')),
    );
  }

  void _startModule(_TrainingModule module) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Starting training: ${module.title}')),
    );
  }

  void _previewModule(_TrainingModule module) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Previewing module: ${module.title}')),
    );
  }
}

class _TrainingModule {
  final String title;
  final String description;
  final String category;
  final String level;
  final int duration;
  final int progress;
  final bool isCompleted;
  final String machineModel;
  final int lessons;
  final double rating;

  _TrainingModule({
    required this.title,
    required this.description,
    required this.category,
    required this.level,
    required this.duration,
    required this.progress,
    required this.isCompleted,
    required this.machineModel,
    required this.lessons,
    required this.rating,
  });
}

