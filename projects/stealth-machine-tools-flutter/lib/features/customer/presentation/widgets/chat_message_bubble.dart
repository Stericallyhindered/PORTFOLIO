import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/theme/smt_theme.dart';
import '../../../../core/services/ai_service.dart';

class ChatMessageBubble extends StatelessWidget {
  final AIMessage message;
  final VoidCallback? onTap;

  const ChatMessageBubble({
    super.key,
    required this.message,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: message.isFromUser 
            ? MainAxisAlignment.end 
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!message.isFromUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: SMTTheme.primaryRed,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.psychology,
                color: SMTTheme.primaryWhite,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
          ],
          
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: message.isFromUser 
                        ? SMTTheme.primaryRed
                        : SMTTheme.primaryWhite,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: SMTTheme.primaryBlack.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Message Content
                      SelectableText(
                        message.message,
                        style: SMTTheme.bodyMedium.copyWith(
                          color: message.isFromUser 
                              ? SMTTheme.primaryWhite
                              : SMTTheme.primaryBlack,
                        ),
                      ),
                      
                      // Attachments
                      if (message.attachments != null && message.attachments!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        ...message.attachments!.map((attachment) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 4),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: (message.isFromUser 
                                  ? SMTTheme.primaryWhite 
                                  : SMTTheme.lightGrey).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _getAttachmentIcon(attachment),
                                  size: 16,
                                  color: message.isFromUser 
                                      ? SMTTheme.primaryWhite
                                      : SMTTheme.primaryGrey,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    attachment,
                                    style: SMTTheme.bodySmall.copyWith(
                                      color: message.isFromUser 
                                          ? SMTTheme.primaryWhite
                                          : SMTTheme.primaryGrey,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ],
                      
                      const SizedBox(height: 8),
                      
                      // Timestamp and Actions
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _formatTime(message.timestamp),
                            style: SMTTheme.caption.copyWith(
                              color: message.isFromUser 
                                  ? SMTTheme.lightGrey2
                                  : SMTTheme.secondaryGrey,
                            ),
                          ),
                          
                          if (!message.isFromUser) ...[
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: message.message));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Message copied to clipboard'),
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              },
                              icon: Icon(
                                Icons.copy,
                                size: 14,
                                color: SMTTheme.secondaryGrey,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          
          if (message.isFromUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: SMTTheme.primaryGrey.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.person,
                color: SMTTheme.primaryGrey,
                size: 16,
              ),
            ),
          ],
        ],
      ),
    );
  }

  IconData _getAttachmentIcon(String attachment) {
    final extension = attachment.split('.').last.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Icons.image;
      case 'mp4':
      case 'avi':
      case 'mov':
        return Icons.video_file;
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'txt':
        return Icons.text_snippet;
      default:
        return Icons.attach_file;
    }
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
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.month}/${timestamp.day}/${timestamp.year}';
    }
  }
}
