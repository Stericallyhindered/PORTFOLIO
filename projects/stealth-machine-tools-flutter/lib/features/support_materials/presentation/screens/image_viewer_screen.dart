import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';

class ImageViewerScreen extends StatefulWidget {
  final String url;
  final String title;
  
  const ImageViewerScreen({
    Key? key,
    required this.url,
    this.title = 'Image',
  }) : super(key: key);
  
  @override
  State<ImageViewerScreen> createState() => _ImageViewerScreenState();
}

class _ImageViewerScreenState extends State<ImageViewerScreen> {
  final TransformationController _transformationController = TransformationController();
  bool _isLoading = true;
  String? _error;
  String? _localPath;
  Uint8List? _imageBytes;
  
  @override
  void initState() {
    super.initState();
    _loadImage();
  }
  
  Future<void> _loadImage() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      
      if (widget.url.startsWith('assets/')) {
        // Load from assets
        final data = await rootBundle.load(widget.url);
        _imageBytes = data.buffer.asUint8List();
        
        // Also save to temp for external opening
        final dir = await getTemporaryDirectory();
        final fileName = widget.url.split('/').last;
        final file = File('${dir.path}/$fileName');
        await file.writeAsBytes(_imageBytes!);
        _localPath = file.path;
      }
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }
  
  Future<void> _openExternally() async {
    try {
      if (_localPath != null) {
        final uri = Uri.file(_localPath!);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri);
        }
      } else if (widget.url.startsWith('http')) {
        final uri = Uri.parse(widget.url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open: $e')),
        );
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.zoom_in),
            onPressed: _zoomIn,
          ),
          IconButton(
            icon: const Icon(Icons.zoom_out),
            onPressed: _zoomOut,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _resetZoom,
            tooltip: 'Reset zoom',
          ),
          IconButton(
            icon: const Icon(Icons.open_in_new),
            onPressed: _openExternally,
            tooltip: 'Open externally',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }
  
  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Colors.white),
            SizedBox(height: 16),
            Text('Loading image...', style: TextStyle(color: Colors.white)),
          ],
        ),
      );
    }
    
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error loading image',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadImage, child: const Text('Retry')),
          ],
        ),
      );
    }
    
    return InteractiveViewer(
      transformationController: _transformationController,
      minScale: 0.5,
      maxScale: 4.0,
      child: Center(child: _buildImage()),
    );
  }
  
  Widget _buildImage() {
    // Local asset with loaded bytes
    if (_imageBytes != null) {
      return Image.memory(
        _imageBytes!,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => _buildImageError(),
      );
    }
    
    // Remote URL
    if (widget.url.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: widget.url,
        placeholder: (context, url) => const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
        errorWidget: (context, url, error) => _buildImageError(),
        fit: BoxFit.contain,
      );
    }
    
    // Try loading as asset directly
    return Image.asset(
      widget.url,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) => _buildImageError(),
    );
  }
  
  Widget _buildImageError() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.broken_image, size: 64, color: Colors.grey),
        const SizedBox(height: 16),
        const Text('Could not load image', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _openExternally,
          icon: const Icon(Icons.open_in_new),
          label: const Text('Open Externally'),
        ),
      ],
    );
  }
  
  void _zoomIn() {
    final currentScale = _transformationController.value.getMaxScaleOnAxis();
    _transformationController.value = Matrix4.identity()..scale(currentScale * 1.2);
  }
  
  void _zoomOut() {
    final currentScale = _transformationController.value.getMaxScaleOnAxis();
    _transformationController.value = Matrix4.identity()..scale(currentScale * 0.8);
  }
  
  void _resetZoom() {
    _transformationController.value = Matrix4.identity();
  }
}
