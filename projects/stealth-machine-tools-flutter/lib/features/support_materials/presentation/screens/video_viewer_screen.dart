import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class VideoViewerScreen extends ConsumerStatefulWidget {
  final String url;
  final String title;
  
  const VideoViewerScreen({
    Key? key,
    required this.url,
    this.title = 'Video Tutorial',
  }) : super(key: key);
  
  @override
  ConsumerState<VideoViewerScreen> createState() => _VideoViewerScreenState();
}

class _VideoViewerScreenState extends ConsumerState<VideoViewerScreen> {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  bool _isLoading = true;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }
  
  Future<void> _initializeVideo() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      
      print('[Video Viewer] Initializing video from URL: ${widget.url}');
      
      _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.url));
      
      _videoPlayerController!.addListener(() {
        if (_videoPlayerController!.value.hasError) {
          print('[Video Viewer] Player error: ${_videoPlayerController!.value.errorDescription}');
        }
      });
      
      await _videoPlayerController!.initialize();
      print('[Video Viewer] Video initialized successfully. Duration: ${_videoPlayerController!.value.duration}');
      
      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        autoPlay: false,
        looping: false,
        allowFullScreen: true,
        allowMuting: true,
        showOptions: true,
        showControlsOnInitialize: true,
        materialProgressColors: ChewieProgressColors(
          playedColor: Colors.red[600]!,
          handleColor: Colors.red[600]!,
          backgroundColor: Colors.grey[300]!,
          bufferedColor: Colors.grey[200]!,
        ),
        placeholder: Container(
          color: Colors.grey[900],
          child: const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
        autoInitialize: true,
      );
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('[Video Viewer] Error initializing video: $e');
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }
  
  @override
  void dispose() {
    _chewieController?.dispose();
    _videoPlayerController?.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.fullscreen),
            onPressed: () {
              _chewieController?.enterFullScreen();
            },
          ),
          IconButton(
            icon: Icon(_chewieController?.videoPlayerController.value.volume == 0 
                ? Icons.volume_off 
                : Icons.volume_up),
            onPressed: () {
              if (_chewieController?.videoPlayerController.value.volume == 0) {
                _chewieController?.videoPlayerController.setVolume(1.0);
              } else {
                _chewieController?.videoPlayerController.setVolume(0.0);
              }
            },
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
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading video...'),
          ],
        ),
      );
    }
    
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading video',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _initializeVideo,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    
    if (_chewieController == null) {
      return const Center(
        child: Text('Video controller not initialized'),
      );
    }
    
    return Chewie(controller: _chewieController!);
  }
}
