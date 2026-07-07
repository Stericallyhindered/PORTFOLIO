import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/services/speech_service.dart';

class KnowledgeCaptureScreen extends ConsumerStatefulWidget {
  const KnowledgeCaptureScreen({super.key});

  @override
  ConsumerState<KnowledgeCaptureScreen> createState() => _KnowledgeCaptureScreenState();
}

class _KnowledgeCaptureScreenState extends ConsumerState<KnowledgeCaptureScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _solutionController = TextEditingController();
  
  String _selectedCategory = 'Troubleshooting';
  String _selectedMachine = 'S1660 Max';
  String _selectedPriority = 'Medium';
  bool _isRecording = false;
  String _recordedText = '';

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _solutionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('Knowledge Capture'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _saveDraft(),
            icon: const Icon(Icons.save),
          ),
          IconButton(
            onPressed: () => _showHelp(),
            icon: const Icon(Icons.help),
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
                        'Knowledge Capture',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Record technical solutions and insights',
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
                    Icons.mic,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Quick Stats
          Container(
            margin: const EdgeInsets.all(24),
            child: Row(
              children: [
                Expanded(child: _buildStatCard('Today', '5', Icons.today, Colors.blue)),
                const SizedBox(width: 16),
                Expanded(child: _buildStatCard('This Week', '23', Icons.calendar_today, Colors.green)),
                const SizedBox(width: 16),
                Expanded(child: _buildStatCard('Total', '156', Icons.library_books, Colors.purple)),
                const SizedBox(width: 16),
                Expanded(child: _buildStatCard('Pending', '3', Icons.pending, Colors.orange)),
              ],
            ),
          ),

          // Form Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Voice Recording Section
                  _buildVoiceRecordingSection(),
                  
                  const SizedBox(height: 24),
                  
                  // Form Fields
                  _buildFormSection(),
                  
                  const SizedBox(height: 24),
                  
                  // Action Buttons
                  _buildActionButtons(),
                  
                  const SizedBox(height: 24),
                ],
              ),
            ),
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

  Widget _buildVoiceRecordingSection() {
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
          Row(
            children: [
              Icon(Icons.mic, color: SMTTheme.primaryRed, size: 24),
              const SizedBox(width: 12),
              Text(
                'Voice Recording',
                style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _isRecording ? Colors.red : Colors.green,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _isRecording ? 'RECORDING' : 'READY',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Recording Controls
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _toggleRecording(),
                  icon: Icon(_isRecording ? Icons.stop : Icons.mic),
                  label: Text(_isRecording ? 'Stop Recording' : 'Start Recording'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isRecording ? Colors.red : SMTTheme.primaryRed,
                    foregroundColor: SMTTheme.primaryWhite,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              OutlinedButton.icon(
                onPressed: () => _clearRecording(),
                icon: const Icon(Icons.clear),
                label: const Text('Clear'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ),
          
          if (_recordedText.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: SMTTheme.lightGrey2,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: SMTTheme.darkGrey.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Recorded Text:',
                    style: SMTTheme.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: SMTTheme.primaryBlack,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _recordedText,
                    style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFormSection() {
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
            'Knowledge Entry Details',
            style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          
          // Title Field
          TextFormField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Title *',
              hintText: 'Brief description of the issue/solution',
              border: OutlineInputBorder(),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Category and Machine Selection
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
                    'Troubleshooting',
                    'Maintenance',
                    'Setup & Installation',
                    'Safety Procedures',
                    'Software Issues',
                    'Hardware Issues',
                    'Best Practices',
                    'Tips & Tricks'
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
                    labelText: 'Machine Model',
                    border: OutlineInputBorder(),
                  ),
                  items: [
                    'S1660 Max',
                    'SMT-2000',
                    'Fiber Laser',
                    'Press Brake',
                    'Tube Laser',
                    'All Models'
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
          
          // Priority Selection
          DropdownButtonFormField<String>(
            value: _selectedPriority,
            decoration: const InputDecoration(
              labelText: 'Priority',
              border: OutlineInputBorder(),
            ),
            items: ['Low', 'Medium', 'High', 'Critical'].map((String value) {
              return DropdownMenuItem<String>(
                value: value,
                child: Text(value),
              );
            }).toList(),
            onChanged: (String? newValue) {
              setState(() {
                _selectedPriority = newValue!;
              });
            },
          ),
          
          const SizedBox(height: 16),
          
          // Description Field
          TextFormField(
            controller: _descriptionController,
            decoration: const InputDecoration(
              labelText: 'Description *',
              hintText: 'Detailed description of the problem or issue',
              border: OutlineInputBorder(),
            ),
            maxLines: 4,
          ),
          
          const SizedBox(height: 16),
          
          // Solution Field
          TextFormField(
            controller: _solutionController,
            decoration: const InputDecoration(
              labelText: 'Solution/Steps *',
              hintText: 'Step-by-step solution or resolution',
              border: OutlineInputBorder(),
            ),
            maxLines: 6,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
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
            'Actions',
            style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _saveDraft(),
                  icon: const Icon(Icons.save),
                  label: const Text('Save Draft'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _submitKnowledge(),
                  icon: const Icon(Icons.send),
                  label: const Text('Submit'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SMTTheme.primaryRed,
                    foregroundColor: SMTTheme.primaryWhite,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _previewEntry(),
                  icon: const Icon(Icons.preview),
                  label: const Text('Preview'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _clearForm(),
                  icon: const Icon(Icons.clear_all),
                  label: const Text('Clear All'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _toggleRecording() async {
    if (_isRecording) {
      setState(() {
        _isRecording = false;
        _recordedText = 'Sample recorded text for demonstration purposes.';
      });
    } else {
      setState(() {
        _isRecording = true;
        _recordedText = '';
      });
    }
  }

  void _clearRecording() {
    setState(() {
      _recordedText = '';
      _isRecording = false;
    });
  }

  void _saveDraft() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Draft saved successfully')),
    );
  }

  void _submitKnowledge() {
    if (_titleController.text.isEmpty || _descriptionController.text.isEmpty || _solutionController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all required fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Knowledge entry submitted successfully')),
    );
    
    _clearForm();
  }

  void _previewEntry() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_titleController.text.isEmpty ? 'Preview Entry' : _titleController.text),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Category: $_selectedCategory',
                style: SMTTheme.bodyMedium.copyWith(fontWeight: FontWeight.bold),
              ),
              Text('Machine: $_selectedMachine'),
              Text('Priority: $_selectedPriority'),
              const SizedBox(height: 16),
              Text(
                'Description:',
                style: SMTTheme.bodyMedium.copyWith(fontWeight: FontWeight.bold),
              ),
              Text(_descriptionController.text),
              const SizedBox(height: 16),
              Text(
                'Solution:',
                style: SMTTheme.bodyMedium.copyWith(fontWeight: FontWeight.bold),
              ),
              Text(_solutionController.text),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitKnowledge();
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _clearForm() {
    _titleController.clear();
    _descriptionController.clear();
    _solutionController.clear();
    setState(() {
      _selectedCategory = 'Troubleshooting';
      _selectedMachine = 'S1660 Max';
      _selectedPriority = 'Medium';
      _recordedText = '';
      _isRecording = false;
    });
  }

  void _showHelp() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Knowledge Capture Help'),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'How to use Knowledge Capture:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text('1. Use voice recording to quickly capture information'),
              Text('2. Fill in the required fields with details'),
              Text('3. Select appropriate category and priority'),
              Text('4. Preview your entry before submitting'),
              Text('5. Save as draft if you need to continue later'),
              SizedBox(height: 16),
              Text(
                'Tips:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text('• Be specific and detailed in your descriptions'),
              Text('• Include step-by-step solutions'),
              Text('• Mention any parts or tools needed'),
              Text('• Set appropriate priority level'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}
