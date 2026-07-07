import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';

class ContentManagementScreen extends ConsumerStatefulWidget {
  const ContentManagementScreen({super.key});

  @override
  ConsumerState<ContentManagementScreen> createState() => _ContentManagementScreenState();
}

class _ContentManagementScreenState extends ConsumerState<ContentManagementScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Content Management'),
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
                        'Content Management',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Manage knowledge base, manuals, and training content',
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
                    Icons.article,
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
                _buildTabButton('Knowledge Base', 0, Icons.library_books),
                _buildTabButton('Manuals', 1, Icons.description),
                _buildTabButton('FAQs', 2, Icons.help),
                _buildTabButton('Training', 3, Icons.school),
              ],
            ),
          ),

          // Content Area
          Expanded(
            child: _buildContentArea(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddContentDialog(),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.add),
        label: const Text('Add Content'),
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
        return _buildKnowledgeBase();
      case 1:
        return _buildManuals();
      case 2:
        return _buildFAQs();
      case 3:
        return _buildTrainingContent();
      default:
        return _buildKnowledgeBase();
    }
  }

  Widget _buildKnowledgeBase() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: 'Search knowledge base...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: SMTTheme.primaryWhite,
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView.builder(
              itemCount: 15,
              itemBuilder: (context, index) => _buildKnowledgeItem(index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKnowledgeItem(int index) {
    final categories = ['Setup', 'Troubleshooting', 'Maintenance', 'Safety'];
    final category = categories[index % categories.length];
    
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
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: SMTTheme.primaryRed.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  category,
                  style: TextStyle(
                    color: SMTTheme.primaryRed,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => _editKnowledgeItem(index),
                icon: const Icon(Icons.edit, color: SMTTheme.darkGrey),
              ),
              IconButton(
                onPressed: () => _deleteKnowledgeItem(index),
                icon: const Icon(Icons.delete, color: Colors.red),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Knowledge Item ${index + 1}',
            style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 8),
          Text(
            'This is a detailed description of the knowledge item. It contains important information about machine setup, troubleshooting procedures, or maintenance guidelines.',
            style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.access_time, size: 16, color: SMTTheme.darkGrey),
              const SizedBox(width: 8),
              Text(
                'Last updated: ${DateTime.now().subtract(Duration(days: index)).toString().split(' ')[0]}',
                style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Published',
                  style: TextStyle(
                    color: Colors.green,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildManuals() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Machine Manuals',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: 10,
              itemBuilder: (context, index) => _buildManualItem(index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManualItem(int index) {
    final manuals = ['Installation Guide', 'Operation Manual', 'Maintenance Manual', 'Safety Instructions'];
    final manual = manuals[index % manuals.length];
    final machines = ['S1660 Max', 'SMT-2000', 'Fiber Laser', 'Press Brake'];
    final machine = machines[index % machines.length];

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
                child: const Icon(Icons.description, color: Colors.blue, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$manual - $machine',
                      style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Version ${index + 1}.0 • ${(index + 1) * 50} pages',
                      style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _downloadManual(index),
                icon: const Icon(Icons.download, color: SMTTheme.primaryRed),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFAQs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Frequently Asked Questions',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: 12,
              itemBuilder: (context, index) => _buildFAQItem(index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFAQItem(int index) {
    final questions = [
      'How do I calibrate my machine?',
      'What maintenance should I perform monthly?',
      'How do I contact technical support?',
      'What safety precautions should I take?'
    ];
    final question = questions[index % questions.length];

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
        title: Text(
          question,
          style: SMTTheme.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
            color: SMTTheme.primaryBlack,
          ),
        ),
        subtitle: Text(
          'Category: ${['General', 'Installation', 'Maintenance', 'Support'][index % 4]}',
          style: SMTTheme.bodySmall.copyWith(color: SMTTheme.darkGrey),
        ),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.orange.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.help_outline, color: Colors.orange, size: 20),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              'This is a detailed answer to the frequently asked question. It provides comprehensive information and step-by-step instructions to help users resolve their issues effectively.',
              style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrainingContent() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Training Modules',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: 8,
              itemBuilder: (context, index) => _buildTrainingModule(index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrainingModule(int index) {
    final modules = [
      'Machine Setup Fundamentals', 'Safety Procedures', 'Basic Operations', 'Maintenance Basics'
    ];
    final module = modules[index % modules.length];

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
                child: const Icon(Icons.play_circle_outline, color: Colors.purple, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      module,
                      style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Duration: ${(index + 1) * 15} minutes • Level: ${['Beginner', 'Intermediate', 'Advanced'][index % 3]}',
                      style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Published',
                  style: TextStyle(
                    color: Colors.green,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddContentDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add New Content'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.library_books),
              title: Text('Knowledge Base Item'),
            ),
            ListTile(
              leading: Icon(Icons.description),
              title: Text('Manual'),
            ),
            ListTile(
              leading: Icon(Icons.help),
              title: Text('FAQ'),
            ),
            ListTile(
              leading: Icon(Icons.school),
              title: Text('Training Module'),
            ),
          ],
        ),
      ),
    );
  }

  void _editKnowledgeItem(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Edit Knowledge Item $index')),
    );
  }

  void _deleteKnowledgeItem(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Delete Knowledge Item $index')),
    );
  }

  void _downloadManual(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Download Manual $index')),
    );
  }
}


