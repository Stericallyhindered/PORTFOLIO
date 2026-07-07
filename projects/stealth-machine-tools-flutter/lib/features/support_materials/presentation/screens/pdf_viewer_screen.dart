import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';

class PdfViewerScreen extends StatefulWidget {
  final String url;
  final String title;
  
  const PdfViewerScreen({
    Key? key,
    required this.url,
    this.title = 'PDF Document',
  }) : super(key: key);
  
  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  final PdfViewerController _controller = PdfViewerController();
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 0;
  
  @override
  void dispose() {
    // PdfViewerController doesn't require explicit disposal in pdfrx
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
          if (_totalPages > 0)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Page $_currentPage of $_totalPages',
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),
          // Zoom controls
          IconButton(
            icon: const Icon(Icons.zoom_out),
            onPressed: () => _controller.zoomDown(),
            tooltip: 'Zoom Out',
          ),
          IconButton(
            icon: const Icon(Icons.zoom_in),
            onPressed: () => _controller.zoomUp(),
            tooltip: 'Zoom In',
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: _totalPages > 1 ? _buildNavigationBar() : null,
    );
  }
  
  Widget _buildBody() {
    if (_error != null) {
      return _buildErrorState();
    }
    
    // pdfrx can load directly from URL - no need to download first
    return Stack(
      children: [
        PdfViewer.uri(
          Uri.parse(widget.url),
          controller: _controller,
          params: PdfViewerParams(
            enableTextSelection: true,
            pageAnchor: PdfPageAnchor.top,
            onViewerReady: (document, controller) {
              setState(() {
                _isLoading = false;
                _totalPages = document.pages.length;
              });
              print('[PDF Viewer] Document loaded: ${document.pages.length} pages');
            },
            onPageChanged: (pageNumber) {
              setState(() {
                _currentPage = pageNumber ?? 1;
              });
            },
            loadingBannerBuilder: (context, bytesDownloaded, totalBytes) {
              final progress = totalBytes != null && totalBytes > 0
                  ? bytesDownloaded / totalBytes
                  : null;
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 80,
                      height: 80,
                      child: CircularProgressIndicator(
                        value: progress,
                        strokeWidth: 6,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.red[600]!),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      progress != null 
                          ? 'Loading PDF... ${(progress * 100).toInt()}%'
                          : 'Loading PDF...',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    if (totalBytes != null)
                      Text(
                        '${(bytesDownloaded / 1024 / 1024).toStringAsFixed(1)} MB / ${(totalBytes / 1024 / 1024).toStringAsFixed(1)} MB',
                        style: TextStyle(color: Colors.grey[500], fontSize: 12),
                      ),
                  ],
                ),
              );
            },
            errorBannerBuilder: (context, error, stackTrace, documentRef) {
              print('[PDF Viewer] Error: $error');
              // Update state to show error UI
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  setState(() {
                    _error = error.toString();
                    _isLoading = false;
                  });
                }
              });
              return _buildErrorState();
            },
          ),
        ),
        // Show loading overlay while initially loading
        if (_isLoading)
          Container(
            color: Colors.white,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.red[600]!),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Loading PDF...',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
  
  Widget _buildNavigationBar() {
    return Container(
      color: Colors.grey[900],
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: const Icon(Icons.first_page, color: Colors.white),
              onPressed: _currentPage > 1
                  ? () => _controller.goToPage(pageNumber: 1)
                  : null,
            ),
            IconButton(
              icon: const Icon(Icons.chevron_left, color: Colors.white),
              onPressed: _currentPage > 1
                  ? () => _controller.goToPage(pageNumber: _currentPage - 1)
                  : null,
            ),
            Text(
              '$_currentPage / $_totalPages',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            IconButton(
              icon: const Icon(Icons.chevron_right, color: Colors.white),
              onPressed: _currentPage < _totalPages
                  ? () => _controller.goToPage(pageNumber: _currentPage + 1)
                  : null,
            ),
            IconButton(
              icon: const Icon(Icons.last_page, color: Colors.white),
              onPressed: _currentPage < _totalPages
                  ? () => _controller.goToPage(pageNumber: _totalPages)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 60,
                color: Colors.red[400],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Could not load PDF',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Unknown error occurred',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _error = null;
                  _isLoading = true;
                });
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[700],
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
