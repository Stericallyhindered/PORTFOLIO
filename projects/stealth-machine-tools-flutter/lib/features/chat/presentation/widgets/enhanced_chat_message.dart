import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/models/chat_message.dart';
import '../../../support_materials/presentation/screens/pdf_viewer_screen.dart';
import '../../../support_materials/presentation/screens/video_viewer_screen.dart';
import '../../../support_materials/presentation/screens/image_viewer_screen.dart';

class EnhancedChatMessage extends ConsumerWidget {
  final ChatMessage message;
  
  const EnhancedChatMessage({
    Key? key,
    required this.message,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Column(
        crossAxisAlignment: message.isUser 
          ? CrossAxisAlignment.end 
          : CrossAxisAlignment.start,
        children: [
          // Message bubble
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.8,
            ),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: message.isUser ? Colors.red[600] : Colors.grey[200],
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.content,
                  style: TextStyle(
                    color: message.isUser ? Colors.white : Colors.black87,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _formatTimestamp(message.timestamp),
                  style: TextStyle(
                    color: message.isUser 
                        ? Colors.white.withOpacity(0.7) 
                        : Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          
          // Material references
          if (!message.isUser && message.metadata?['referenced_materials'] != null)
            _buildMaterialReferences(context),
        ],
      ),
    );
  }
  
  Widget _buildMaterialReferences(BuildContext context) {
    final materials = message.metadata!['referenced_materials'] as List;
    
    if (materials.isEmpty) return const SizedBox.shrink();
    
    return Container(
      margin: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.red[50],
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.red[200]!),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.library_books, size: 16, color: Colors.red[700]),
                const SizedBox(width: 4),
                Text(
                  'Referenced Materials',
                  style: TextStyle(
                    color: Colors.red[700],
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          ...materials.map((material) => _buildMaterialCard(context, material)),
        ],
      ),
    );
  }
  
  Widget _buildMaterialCard(BuildContext context, Map<String, dynamic> material) {
    final isLocal = material['is_local'] == true;
    final fileType = material['type'] as String? ?? 'pdf';
    final title = material['title'] as String;
    final category = material['category'] as String;
    
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        elevation: 2,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _openMaterial(context, material),
          child: Container(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                _getFileTypeIcon(fileType),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: _getCategoryColor(category).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              category.toUpperCase(),
                              style: TextStyle(
                                color: _getCategoryColor(category),
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            fileType.toUpperCase(),
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 10,
                            ),
                          ),
                          if (isLocal) ...[
                            const SizedBox(width: 8),
                            Icon(
                              Icons.offline_pin,
                              size: 12,
                              color: Colors.green[600],
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.open_in_new,
                  color: Colors.grey[600],
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _getFileTypeIcon(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.red[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.picture_as_pdf, color: Colors.red[700], size: 20),
        );
      case 'mp4':
      case 'video':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.red[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.play_circle, color: Colors.red[700], size: 20),
        );
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.green[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.image, color: Colors.green[700], size: 20),
        );
      case 'docx':
      case 'document':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.red[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.description, color: Colors.red[700], size: 20),
        );
      case 'txt':
      case 'text':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.text_snippet, color: Colors.grey[700], size: 20),
        );
      default:
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.attach_file, color: Colors.grey[700], size: 20),
        );
    }
  }
  
  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'manuals':
        return Colors.red;
      case 'contracts':
        return Colors.red[800]!;
      case 'troubleshooting':
        return Colors.orange;
      case 'schematics':
        return Colors.red[600]!;
      case 'videos':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
  
  void _openMaterial(BuildContext context, Map<String, dynamic> material) {
    final fileType = material['type'] as String? ?? 'pdf';
    final title = material['title'] as String;
    final url = material['url'] as String? ?? '';
    final isLocal = material['is_local'] == true;
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PdfViewerScreen(
              url: url,
              title: title,
            ),
          ),
        );
        break;
      case 'mp4':
      case 'video':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VideoViewerScreen(
              url: url,
              title: title,
            ),
          ),
        );
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ImageViewerScreen(
              url: url,
              title: title,
            ),
          ),
        );
        break;
      case 'docx':
      case 'document':
      case 'txt':
      case 'text':
        // For documents, try to open with external app
        _launchUrl(url);
        break;
      default:
        // For other file types, try to open with external app
        _launchUrl(url);
    }
  }
  
  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      // Handle error - could show a snackbar or dialog
      print('Could not launch $url');
    }
  }
  
  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
    }
  }
}
