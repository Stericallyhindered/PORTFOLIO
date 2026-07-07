import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/support_material_model.dart';
import '../screens/pdf_viewer_screen.dart';
import '../screens/video_viewer_screen.dart';
import '../screens/image_viewer_screen.dart';

class MaterialCard extends ConsumerWidget {
  final SupportMaterial material;
  final VoidCallback? onTap;
  
  const MaterialCard({
    Key? key,
    required this.material,
    this.onTap,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap ?? () => _openMaterial(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  // File type icon
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _getFileTypeColor(material.fileType).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getFileTypeIcon(material.fileType),
                      color: _getFileTypeColor(material.fileType),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Title and category
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          material.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: _getCategoryColor(material.category).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                material.categoryDisplayName,
                                style: TextStyle(
                                  color: _getCategoryColor(material.category),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              material.fileType.toUpperCase(),
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                              ),
                            ),
                            if (material.isLocal) ...[
                              const SizedBox(width: 8),
                              Icon(
                                Icons.offline_pin,
                                size: 14,
                                color: Colors.green[600],
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  // Action button
                  Icon(
                    Icons.open_in_new,
                    color: Colors.grey[600],
                    size: 20,
                  ),
                ],
              ),
              
              // Description
              if (material.description.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  material.description,
                  style: TextStyle(
                    color: Colors.grey[700],
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              
              // Machine model and tags
              if (material.machineModel != null || material.tags.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    if (material.machineModel != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Text(
                          material.machineModel!,
                          style: TextStyle(
                            color: Colors.red[700],
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ...material.tags.take(3).map((tag) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        tag,
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 12,
                        ),
                      ),
                    )),
                  ],
                ),
              ],
              
              // Footer with file size and date
              const SizedBox(height: 12),
              Row(
                children: [
                  if (material.fileSizeBytes > 0) ...[
                    Icon(
                      Icons.storage,
                      size: 14,
                      color: Colors.grey[500],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      material.fileSizeDisplay,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: Colors.grey[500],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(material.lastUpdated),
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _openMaterial(BuildContext context) {
    switch (material.fileType.toLowerCase()) {
      case 'pdf':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PdfViewerScreen(
              url: material.fileUrl,
              title: material.title,
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
              url: material.fileUrl,
              title: material.title,
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
              url: material.fileUrl,
              title: material.title,
            ),
          ),
        );
        break;
      default:
        // For other file types, show a dialog with options
        _showOpenOptionsDialog(context);
    }
  }
  
  void _showOpenOptionsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(material.title),
        content: Text('This file type (${material.fileType}) cannot be viewed directly in the app.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement external app opening
            },
            child: const Text('Open Externally'),
          ),
        ],
      ),
    );
  }
  
  IconData _getFileTypeIcon(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'mp4':
      case 'video':
        return Icons.play_circle;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        return Icons.image;
      case 'docx':
      case 'document':
        return Icons.description;
      case 'txt':
      case 'text':
        return Icons.text_snippet;
      default:
        return Icons.attach_file;
    }
  }
  
  Color _getFileTypeColor(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Colors.red;
      case 'mp4':
      case 'video':
        return Colors.red;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        return Colors.green;
      case 'docx':
      case 'document':
        return Colors.red;
      case 'txt':
      case 'text':
        return Colors.grey;
      default:
        return Colors.orange;
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
  
  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays < 1) {
      return 'Today';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else if (difference.inDays < 30) {
      return '${(difference.inDays / 7).floor()} weeks ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
