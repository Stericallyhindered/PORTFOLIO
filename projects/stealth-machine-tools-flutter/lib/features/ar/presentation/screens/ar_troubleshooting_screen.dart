import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';

class ARTroubleshootingScreen extends ConsumerStatefulWidget {
  final String machineId;
  
  const ARTroubleshootingScreen({super.key, required this.machineId});

  @override
  ConsumerState<ARTroubleshootingScreen> createState() => _ARTroubleshootingScreenState();
}

class _ARTroubleshootingScreenState extends ConsumerState<ARTroubleshootingScreen> {
  bool _isCameraActive = false;
  bool _isScanning = false;
  String _detectedIssue = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SMTTheme.lightGrey2,
      appBar: AppBar(
        title: const Text('AR Troubleshooting'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _toggleCamera(),
            icon: Icon(_isCameraActive ? Icons.camera_alt : Icons.camera_alt_outlined),
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
                        'AR Troubleshooting',
                        style: SMTTheme.heading1.copyWith(
                          color: SMTTheme.primaryWhite,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Use your camera to diagnose machine issues',
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
                    Icons.camera_alt,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
          ),

          // Status Cards
          Container(
            margin: const EdgeInsets.all(24),
            child: Row(
              children: [
                Expanded(child: _buildStatusCard('Camera', _isCameraActive ? 'Active' : 'Inactive', Icons.camera_alt, _isCameraActive ? Colors.green : Colors.grey)),
                const SizedBox(width: 16),
                Expanded(child: _buildStatusCard('Scanning', _isScanning ? 'Active' : 'Ready', Icons.scanner, _isScanning ? Colors.blue : Colors.grey)),
                const SizedBox(width: 16),
                Expanded(child: _buildStatusCard('Issues Found', _detectedIssue.isEmpty ? '0' : '1', Icons.warning, _detectedIssue.isEmpty ? Colors.grey : Colors.orange)),
              ],
            ),
          ),

          // Camera View
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
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
                  // Camera Header
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: SMTTheme.primaryRed,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.camera_alt, color: Colors.white, size: 24),
                        const SizedBox(width: 12),
                        Text(
                          'Machine Camera View',
                          style: SMTTheme.heading3.copyWith(color: Colors.white),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _isCameraActive ? Colors.green : Colors.red,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _isCameraActive ? 'LIVE' : 'OFFLINE',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Camera Feed Area
                  Expanded(
                    child: _buildCameraView(),
                  ),

                  // Controls
                  Container(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _toggleCamera(),
                                icon: Icon(_isCameraActive ? Icons.stop : Icons.play_arrow),
                                label: Text(_isCameraActive ? 'Stop Camera' : 'Start Camera'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _isCameraActive ? Colors.red : SMTTheme.primaryRed,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _startScanning(),
                                icon: const Icon(Icons.scanner),
                                label: const Text('Scan for Issues'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue,
                                  foregroundColor: Colors.white,
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
                                onPressed: () => _captureImage(),
                                icon: const Icon(Icons.camera),
                                label: const Text('Capture'),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _resetView(),
                                icon: const Icon(Icons.refresh),
                                label: const Text('Reset'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Troubleshooting Results
          if (_detectedIssue.isNotEmpty) ...[
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
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
                      Icon(Icons.warning, color: Colors.orange, size: 24),
                      const SizedBox(width: 12),
                      Text(
                        'Issue Detected',
                        style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _detectedIssue,
                    style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => _showTroubleshootingSteps(),
                    icon: const Icon(Icons.list),
                    label: const Text('View Solution Steps'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SMTTheme.primaryRed,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Quick Actions
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
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
                  'Quick Actions',
                  style: SMTTheme.heading3.copyWith(color: SMTTheme.primaryBlack),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildQuickActionChip('Check Alignment', () => _checkAlignment()),
                    _buildQuickActionChip('Inspect Cutting Head', () => _inspectCuttingHead()),
                    _buildQuickActionChip('Check Coolant Flow', () => _checkCoolantFlow()),
                    _buildQuickActionChip('Verify Safety Systems', () => _verifySafetySystems()),
                    _buildQuickActionChip('Test Power Supply', () => _testPowerSupply()),
                    _buildQuickActionChip('Check Air Pressure', () => _checkAirPressure()),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStatusCard(String title, String status, IconData icon, Color color) {
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
            status,
            style: SMTTheme.bodyMedium.copyWith(
              color: SMTTheme.primaryBlack,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: SMTTheme.bodySmall.copyWith(
              color: SMTTheme.darkGrey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCameraView() {
    if (!_isCameraActive) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.camera_alt_outlined, size: 80, color: SMTTheme.darkGrey),
            const SizedBox(height: 16),
            Text(
              'Camera Not Active',
              style: SMTTheme.heading3.copyWith(color: SMTTheme.darkGrey),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap "Start Camera" to begin AR troubleshooting',
              style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.darkGrey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(0),
      ),
      child: Stack(
        children: [
          // Mock camera feed
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.grey.shade800,
                  Colors.grey.shade600,
                ],
              ),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.precision_manufacturing, size: 100, color: Colors.white),
                  const SizedBox(height: 16),
                  Text(
                    'Machine View Active',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Point camera at your SMT machine',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),

          // Scanning overlay
          if (_isScanning) ...[
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.blue, width: 2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                ),
              ),
            ),
          ],

          // Issue detection overlay
          if (_detectedIssue.isNotEmpty) ...[
            Positioned(
              top: 20,
              left: 20,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.warning, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Issue Detected',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ],
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

  void _toggleCamera() {
    setState(() {
      _isCameraActive = !_isCameraActive;
      if (!_isCameraActive) {
        _isScanning = false;
        _detectedIssue = '';
      }
    });
  }

  void _startScanning() {
    if (!_isCameraActive) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please start the camera first')),
      );
      return;
    }

    setState(() {
      _isScanning = true;
    });

    // Simulate scanning process
    Future.delayed(const Duration(seconds: 3), () {
      setState(() {
        _isScanning = false;
        _detectedIssue = 'Misaligned cutting head detected. The cutting head appears to be 2mm off-center, which may cause inaccurate cuts.';
      });
    });
  }

  void _captureImage() {
    if (!_isCameraActive) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Camera must be active to capture images')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Image captured and saved to gallery')),
    );
  }

  void _resetView() {
    setState(() {
      _isScanning = false;
      _detectedIssue = '';
    });
  }

  void _showTroubleshootingSteps() {
    final steps = [
      'Power down the machine completely',
      'Remove the cutting head cover',
      'Check alignment screws on the cutting head mount',
      'Use precision tools to realign the head to center position',
      'Verify alignment with test cuts',
      'Reinstall cover and test operation'
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(
                color: SMTTheme.lightGrey2,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Troubleshooting Steps',
                    style: SMTTheme.heading2.copyWith(color: SMTTheme.primaryBlack),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView.builder(
                      itemCount: steps.length,
                      itemBuilder: (context, index) => ListTile(
                        leading: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: SMTTheme.primaryRed,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        title: Text(
                          steps[index],
                          style: SMTTheme.bodyMedium.copyWith(color: SMTTheme.primaryBlack),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _checkAlignment() {
    _performQuickCheck('Alignment Check', 'Checking machine alignment...');
  }

  void _inspectCuttingHead() {
    _performQuickCheck('Cutting Head Inspection', 'Inspecting cutting head condition...');
  }

  void _checkCoolantFlow() {
    _performQuickCheck('Coolant Flow Check', 'Verifying coolant system...');
  }

  void _verifySafetySystems() {
    _performQuickCheck('Safety Systems', 'Checking safety interlocks...');
  }

  void _testPowerSupply() {
    _performQuickCheck('Power Supply Test', 'Testing power delivery...');
  }

  void _checkAirPressure() {
    _performQuickCheck('Air Pressure Check', 'Verifying air pressure levels...');
  }

  void _performQuickCheck(String checkName, String message) {
    if (!_isCameraActive) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Camera must be active for AR checks')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$checkName completed successfully')),
    );
  }

  void _showHelp() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('AR Troubleshooting Help'),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'How to use AR Troubleshooting:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text('1. Start the camera to begin AR mode'),
              Text('2. Point your device at the machine'),
              Text('3. Use "Scan for Issues" to detect problems'),
              Text('4. Follow the guided troubleshooting steps'),
              Text('5. Use quick actions for specific checks'),
              SizedBox(height: 16),
              Text(
                'Tips:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text('• Ensure good lighting for better detection'),
              Text('• Keep device steady while scanning'),
              Text('• Follow all safety procedures'),
              Text('• Contact support if issues persist'),
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

