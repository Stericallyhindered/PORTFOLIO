import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/services/ai_service.dart';
import '../../../../core/services/speech_service.dart';
import '../widgets/chat_message_bubble.dart';
import '../widgets/machine_selector.dart';

class ChatSupportScreen extends ConsumerStatefulWidget {
  const ChatSupportScreen({super.key});

  @override
  ConsumerState<ChatSupportScreen> createState() => _ChatSupportScreenState();
}

class _ChatSupportScreenState extends ConsumerState<ChatSupportScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isListening = false;
  bool _isTyping = false;
  String _selectedMachine = '';

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final aiMessages = ref.watch(aiServiceProvider);
    final speechService = ref.watch(speechServiceProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('AI Support Chat'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _clearChat(),
            icon: const Icon(Icons.clear_all),
          ),
          IconButton(
            onPressed: () => _showChatHistory(),
            icon: const Icon(Icons.history),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header with Machine Selection
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
                const SMTLogoCircular(size: 50),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI Support Assistant',
                        style: SMTTheme.heading2.copyWith(
                          color: SMTTheme.primaryWhite,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Get instant help with your machine issues',
                        style: SMTTheme.bodyMedium.copyWith(
                          color: SMTTheme.lightGrey2,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.smart_toy,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ],
            ),
          ),

          // Machine Selector
          Container(
            margin: const EdgeInsets.all(16),
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Select Your Machine',
                  style: SMTTheme.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: SMTTheme.primaryBlack,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedMachine.isEmpty ? null : _selectedMachine,
                        decoration: InputDecoration(
                          hintText: 'Choose machine for context',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: [
                          'S1660 Max Fiber Laser',
                          'SMT-2000 Press Brake',
                          'Fiber Laser System',
                          'Tube Laser Machine',
                          'Press Brake System'
                        ].map((String machine) {
                          return DropdownMenuItem<String>(
                            value: machine,
                            child: Text(machine),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            _selectedMachine = newValue ?? '';
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _selectedMachine.isNotEmpty ? Colors.green : Colors.grey,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _selectedMachine.isNotEmpty ? Icons.check : Icons.warning,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Chat Messages
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
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
              child: _buildChatMessages(aiMessages),
            ),
          ),

          // Typing Indicator
          if (_isTyping)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(12),
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
                  const SMTLogoCircular(size: 32),
                  const SizedBox(width: 12),
                  Text(
                    'AI Assistant is typing...',
                    style: SMTTheme.bodyMedium.copyWith(
                      color: SMTTheme.darkGrey,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(SMTTheme.primaryRed),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // Message Input
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
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
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: InputDecoration(
                          hintText: 'Ask about your machine...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: SMTTheme.lightGrey2,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        maxLines: 3,
                        minLines: 1,
                        onSubmitted: (value) => _sendMessage(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: _isListening ? Colors.red : SMTTheme.primaryRed,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: IconButton(
                            onPressed: () => _toggleListening(),
                            icon: Icon(
                              _isListening ? Icons.mic : Icons.mic_none,
                              color: SMTTheme.primaryWhite,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: _sendMessage,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: SMTTheme.primaryRed,
                            foregroundColor: SMTTheme.primaryWhite,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Icon(Icons.send),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Wrap(
                        spacing: 8,
                        children: [
                          _buildQuickActionChip('Machine not starting', () => _sendQuickMessage('My machine is not starting up properly')),
                          _buildQuickActionChip('Calibration needed', () => _sendQuickMessage('I need help with machine calibration')),
                          _buildQuickActionChip('Error codes', () => _sendQuickMessage('I\'m getting error codes on my machine')),
                          _buildQuickActionChip('Maintenance', () => _sendQuickMessage('What maintenance should I perform?')),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildChatMessages(List messages) {
    if (messages.isEmpty) {
      return _buildWelcomeMessage();
    }

    return ListView.builder(
      controller: _scrollController,
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final message = messages[index];
        return ChatMessageBubble(
          message: message,
        );
      },
    );
  }

  Widget _buildWelcomeMessage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SMTLogoCircular(size: 80),
          const SizedBox(height: 24),
          Text(
            'Welcome to AI Support!',
            style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
          ),
          const SizedBox(height: 12),
          Text(
            'I\'m here to help you with your machine issues.\nAsk me anything about troubleshooting, maintenance, or operation.',
            style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Icon(Icons.lightbulb, color: Colors.blue, size: 32),
                const SizedBox(height: 8),
                Text(
                  'Pro Tip: Select your machine above for more accurate help!',
                  style: SMTTheme.bodyMedium.copyWith(
                    color: Colors.blue,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Loading chat history...'),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(
            'Error loading chat',
            style: SMTTheme.heading3.copyWith(color: Colors.red),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: SMTTheme.bodyMedium.copyWith(color: Colors.red),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.refresh(aiServiceProvider),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionChip(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: SMTTheme.primaryRed.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: SMTTheme.primaryRed.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: SMTTheme.bodySmall.copyWith(
            color: SMTTheme.primaryRed,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  void _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    _messageController.clear();
    setState(() {
      _isTyping = true;
    });

    // Add user message
    // User message is automatically added by sendMessage

    // Simulate AI response
    await Future.delayed(const Duration(seconds: 2));

    // Generate contextual AI response
    final aiResponse = _generateAIResponse(message);
    // AI response is automatically added by sendMessage

    setState(() {
      _isTyping = false;
    });

    // Scroll to bottom
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendQuickMessage(String message) {
    _messageController.text = message;
    _sendMessage();
  }

  String _generateAIResponse(String userMessage) {
    final message = userMessage.toLowerCase();
    
    if (message.contains('not starting') || message.contains('startup')) {
      return 'I can help you troubleshoot startup issues. Let\'s check a few things:\n\n1. Verify power supply is connected\n2. Check emergency stop button is released\n3. Ensure all safety interlocks are engaged\n4. Check for any error messages on the display\n\nCan you tell me what specific symptoms you\'re seeing when you try to start the machine?';
    } else if (message.contains('calibration') || message.contains('calibrate')) {
      return 'Machine calibration is important for optimal performance. Here\'s the general process:\n\n1. Ensure machine is at operating temperature\n2. Follow the calibration sequence in your manual\n3. Use proper calibration tools\n4. Document calibration results\n\nFor your ${_selectedMachine.isNotEmpty ? _selectedMachine : 'machine'}, would you like me to provide the specific calibration steps?';
    } else if (message.contains('error') || message.contains('code')) {
      return 'Error codes help identify specific issues. Common steps to resolve:\n\n1. Note the exact error code number\n2. Check the error code reference in your manual\n3. Clear any obvious obstructions\n4. Reset the system if safe to do so\n\nWhat error code are you seeing? I can provide specific troubleshooting steps.';
    } else if (message.contains('maintenance')) {
      return 'Regular maintenance keeps your machine running smoothly. Key areas to check:\n\n• Daily: Clean work area, check for loose parts\n• Weekly: Lubricate moving parts, check fluid levels\n• Monthly: Inspect cutting tools, check alignment\n• Quarterly: Professional service inspection\n\nWould you like a detailed maintenance schedule for your specific machine?';
    } else {
      return 'I understand you need help with: "$userMessage"\n\nI\'m here to assist you with your machine issues. Can you provide more details about:\n\n• What machine model you\'re working with\n• What specific problem you\'re experiencing\n• Any error messages you\'ve seen\n• What you\'ve already tried\n\nThis will help me give you the most accurate guidance.';
    }
  }

  void _toggleListening() async {
    final speechService = ref.read(speechServiceProvider.notifier);
    
    if (_isListening) {
      await speechService.stopListening();
      setState(() {
        _isListening = false;
      });
    } else {
      setState(() {
        _isListening = true;
      });
      
      await speechService.startListening();
      // Wait a bit for speech recognition
      await Future.delayed(const Duration(seconds: 3));
      final recognizedText = speechService.state.recognizedText;
      if (recognizedText.isNotEmpty) {
        _messageController.text = recognizedText;
      }
      setState(() {
        _isListening = false;
      });
    }
  }

  void _clearChat() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Chat'),
        content: const Text('Are you sure you want to clear the chat history?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(aiServiceProvider.notifier).state = [];
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _showChatHistory() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chat history - Implementation needed')),
    );
  }
}