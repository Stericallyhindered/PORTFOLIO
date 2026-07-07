import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';
import '../../../../core/services/ai_service.dart';

class AIChatCard extends ConsumerWidget {
  const AIChatCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final aiMessages = ref.watch(aiServiceProvider);
    final lastMessage = aiMessages.isNotEmpty ? aiMessages.last : null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: SMTTheme.primaryRed,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.psychology,
                        color: SMTTheme.primaryWhite,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'AI Assistant',
                      style: SMTTheme.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => context.push('/customer/chat'),
                  child: const Text('Chat Now'),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            if (lastMessage == null)
              _buildEmptyState(context)
            else
              _buildLastMessagePreview(lastMessage, context),
            
            const SizedBox(height: 16),
            
            // Quick Questions
            Text(
              'Quick Questions',
              style: SMTTheme.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
                color: SMTTheme.primaryGrey,
              ),
            ),
            
            const SizedBox(height: 12),
            
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildQuickQuestion(
                  context,
                  'How to calibrate laser?',
                  () => _sendQuickMessage(context, ref, 'How do I calibrate my laser?'),
                ),
                _buildQuickQuestion(
                  context,
                  'Maintenance schedule?',
                  () => _sendQuickMessage(context, ref, 'What is my maintenance schedule?'),
                ),
                _buildQuickQuestion(
                  context,
                  'Cut quality issues?',
                  () => _sendQuickMessage(context, ref, 'My cut quality is poor, what should I check?'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: SMTTheme.lightGrey,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 32,
            color: SMTTheme.primaryGrey,
          ),
          const SizedBox(height: 8),
          Text(
            'Start a conversation',
            style: SMTTheme.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            'Ask me anything about your SMT machines',
            style: SMTTheme.bodySmall.copyWith(
              color: SMTTheme.primaryGrey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLastMessagePreview(AIMessage message, BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: message.isFromUser 
            ? SMTTheme.primaryRed.withOpacity(0.1)
            : SMTTheme.lightGrey,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                message.isFromUser ? Icons.person : Icons.psychology,
                size: 16,
                color: message.isFromUser ? SMTTheme.primaryRed : SMTTheme.primaryGrey,
              ),
              const SizedBox(width: 8),
              Text(
                message.isFromUser ? 'You' : 'AI Assistant',
                style: SMTTheme.caption.copyWith(
                  fontWeight: FontWeight.w600,
                  color: message.isFromUser ? SMTTheme.primaryRed : SMTTheme.primaryGrey,
                ),
              ),
              const Spacer(),
              Text(
                _formatTime(message.timestamp),
                style: SMTTheme.caption,
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          Text(
            message.message,
            style: SMTTheme.bodyMedium,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickQuestion(
    BuildContext context,
    String question,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: SMTTheme.primaryWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: SMTTheme.lightGrey2),
        ),
        child: Text(
          question,
          style: SMTTheme.bodySmall,
        ),
      ),
    );
  }

  void _sendQuickMessage(BuildContext context, WidgetRef ref, String message) {
    final aiService = ref.read(aiServiceProvider.notifier);
    aiService.sendMessage(message: message);
    context.push('/customer/chat');
  }

  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.month}/${timestamp.day}';
    }
  }
}
