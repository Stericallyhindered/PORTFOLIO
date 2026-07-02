import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

import '../providers/ble_provider.dart'; // This should now export JB4BleProvider

class FirmwareScreen extends StatefulWidget {
  const FirmwareScreen({Key? key}) : super(key: key);

  @override
  State<FirmwareScreen> createState() => _FirmwareScreenState();
}

class _FirmwareScreenState extends State<FirmwareScreen> {
  bool _isUpdating = false;
  double _progress = 0.0;
  // Internal log list (not shown in the UI)
  final List<String> _fwLogs = [];
  final Stopwatch _stopwatch = Stopwatch();

  late JB4BleProvider _ble;

  // Firmware buffer & constants (matching PC logic)
  static const int kMaxSize = 65536; // 64KB for 26K80
  final Uint8List _fwBuffer = Uint8List(kMaxSize);
  static const int kBlockSize = 64;
  final int _bootBlocks = 32;   // 32*64 = 2048 bytes (bootloader area)
  final int _memoryBlocks = 1020; // 1020*64 = 65280 bytes

  // Summation variables (as in PC code)
  int _checksum3 = 0;         // Accumulates each data byte
  int _tempByteCount2 = 0;    // Total count of data bytes parsed
  int _finalChecksum = 0;     // Calculated as: _checksum3 + ((63232 - _tempByteCount2) * 255)
  int _maxWriteAddr = 0;      // Highest address written

  // NEW command definitions for the new firmware:
  // Enter Bootloader ("ZY"): [0x5A, 0x59]
  final List<int> _bootCmd    = [0x5A, 0x59];
  // Delete command ("U"): [0x55]
  final List<int> _eraseCmd   = [0x55];
  // Initiate Flash Write ("V"): [0x56]
  final List<int> _startCmd   = [0x56];
  // Verification/Board Query ("E"): [0x45]
  final List<int> _verifyCmd  = [0x45];
  // Exit Bootloader ("YX"): [0x59, 0x58]
  final List<int> _exitCmd    = [0x59, 0x58];

  // NEW firmware URL – update this as needed
  final String _firmwareUrl = "http://www.jb4logs.com/jb4pro/jb4_pro_test2.hex";

  // State variables for firmware file selection
  bool _firmwareReady = false;
  String? _firmwareFileContent;
  // Status message to display above the progress bar
  String _statusMessage = "";

  @override
  void initState() {
    super.initState();
    _ble = context.read<JB4BleProvider>();

    // Fill the firmware buffer with 0xFF (as in PC code)
    for (int i = 0; i < kMaxSize; i++) {
      _fwBuffer[i] = 0xFF;
    }
  }

  /// Initiates the firmware update using either the downloaded HEX file or a manually selected firmware.
  Future<void> _startFirmwareUpdate() async {
    if (_ble.status != "Connected") {
      _log("Device not connected. Connect first!");
      return;
    }

    // Pause ASCII updates during firmware update.
    _ble.setFirmwareUpdateMode(true);

    setState(() {
      _isUpdating = true;
      _progress = 0.0;
      _statusMessage = "Starting firmware update...";
    });
    _stopwatch.reset();
    _stopwatch.start();
    _log("=== Starting Firmware Update ===");

    try {
      // Load HEX file: use manual file if selected, else download from URL.
      String hexContent;
      if (_firmwareFileContent != null) {
        _log("Using manually selected firmware file.");
        hexContent = _firmwareFileContent!;
      } else {
        _log("Downloading HEX from $_firmwareUrl...");
        final response = await http.get(Uri.parse(_firmwareUrl));
        if (response.statusCode != 200) {
          _log("Failed to download HEX (HTTP code=${response.statusCode})");
          _finish(false);
          return;
        }
        hexContent = response.body;
      }

      // Parse the HEX file
      bool parseOk = _parseHexFile(hexContent);
      if (!parseOk || _tempByteCount2 == 0) {
        _log("No valid data parsed (addresses > 0x3FF) => abort");
        _finish(false);
        return;
      }
      _finalChecksum = _checksum3 + ((63232 - _tempByteCount2) * 255);
      _log("HEX parsed: finalChecksum=$_finalChecksum, _maxWriteAddr=$_maxWriteAddr");

      // Step B: Enter bootloader mode using "ZY"
      _log("Sending bootloader command: $_bootCmd, then waiting 3 seconds...");
      bool bootOk = await _ble.sendCommandWithoutResponsePublic(_bootCmd);
      if (!bootOk) {
        _log("Failed sending bootloader command => abort");
        _finish(false);
        return;
      }
      await Future.delayed(const Duration(seconds: 3));

      // Step C: Send the delete command ("U") 2 times
      for (int i = 0; i < 2; i++) {
        _log("Sending delete command (U) (attempt ${i + 1}/2) and waiting for reply...");
        bool eraseOk = await _ble.sendCommandAndWaitForResponsePublic(
          _eraseCmd,
          expectedResponseCode: 0x55,
          retries: 0,
        );
        if (!eraseOk) {
          _log("Delete command (U) attempt ${i + 1} failed => abort");
          _finish(false);
          return;
        }
        _log("Delete command (U) attempt ${i + 1} successful.");
      }

      // Step D: Wait an additional 7 seconds after delete commands
      setState(() {
        _statusMessage = "Erasing device...";
      });
      _log("Waiting additional 7 seconds after delete commands...");
      await Future.delayed(const Duration(seconds: 7));

      // Step E: Send flash write command ("V")
      setState(() {
        _statusMessage = "Updating Firmware...";
      });
      _log("Sending flash write command (V) with no ack wait...");
      bool startOk = await _ble.sendCommandWithoutResponsePublic(_startCmd);
      if (!startOk) {
        _log("Failed sending flash write command (V) => abort");
        _finish(false);
        return;
      }

      // Step F: Write firmware blocks
      bool blocksOk = await _writeBlocks();
      if (!blocksOk) {
        _log("Block writes failed => abort");
        _finish(false);
        return;
      }
      _log("All blocks written. Waiting 5000ms to ensure write mode exit...");
      await Future.delayed(const Duration(milliseconds: 5000));

      // Step G: Verify checksum using query command ("E")
      bool verifyOk = await _verifySummation();
      if (!verifyOk) {
        // Prompt the user to proceed anyway
        bool proceed = await _promptUserToProceed();
        if (!proceed) {
          _log("Checksum mismatch! Update aborted by user.");
          _finish(false);
          return;
        } else {
          _log("User chose to proceed despite checksum mismatch.");
        }
      } else {
        _log("Checksum verified successfully.");
      }

      // Step H: Exit bootloader (reboot) using "YX"
      _log("Sending exit bootloader command: $_exitCmd...");
      await _ble.sendCommandWithoutResponsePublic(_exitCmd);

      _finish(true);
    } catch (e) {
      _log("Exception: $e");
      _finish(false);
    }
  }

  /// Write firmware blocks without sending padding bytes.
  Future<bool> _writeBlocks() async {
    int lastBlock = _maxWriteAddr ~/ kBlockSize;
    int blocksToWrite = 0;
    // Count only blocks (from boot area onward) that contain data.
    for (int i = _bootBlocks; i <= lastBlock; i++) {
      int start = i * kBlockSize;
      int end = start + kBlockSize;
      bool hasData = false;
      for (int j = start; j < end; j++) {
        if (_fwBuffer[j] != 0xFF) {
          hasData = true;
          break;
        }
      }
      if (hasData) blocksToWrite++;
    }
    if (blocksToWrite < 1) {
      _log("No blocks with valid firmware data found.");
      return true;
    }
    int writtenCount = 0;
    // Write each block that has data.
    for (int i = _bootBlocks; i <= lastBlock; i++) {
      int start = i * kBlockSize;
      int end = start + kBlockSize;
      bool hasData = false;
      for (int j = start; j < end; j++) {
        if (_fwBuffer[j] != 0xFF) {
          hasData = true;
          break;
        }
      }
      if (!hasData) {
        _log("Block $i is all padding, skipping.");
        continue;
      }
      Uint8List chunk = _fwBuffer.sublist(start, end);
      bool ok = await _writeBlockAndCheckReply(chunk);
      if (!ok) {
        _log("Block $i write failed (invalid reply) => abort");
        return false;
      }
      writtenCount++;
      setState(() {
        _progress = writtenCount / blocksToWrite;
      });
    }
    return true;
  }

  Future<bool> _writeBlockAndCheckReply(Uint8List block) async {
    bool sendOk = await _ble.sendCommandWithoutResponsePublic(block);
    if (!sendOk) {
      _log("Failed to send block");
      return false;
    }
    String? replyStr = await _ble.readStringResponse(
      "block",
      command: [],
      timeout: const Duration(milliseconds: 600),
    );
    if (replyStr == null || replyStr.isEmpty) {
      _log("No reply received for block write");
      return false;
    }
    int replyByte = replyStr.codeUnitAt(0);
    _log("Block write reply: 0x${replyByte.toRadixString(16)}");
    if (replyByte == 0x58) {
      _log("Block write reply is 0x58, indicating device dropped out of write mode.");
      return false;
    }
    return true;
  }

  /// Recalculates the local checksum by summing the bytes from address 0x800
  /// for a total of 63232 bytes. This matches the PC’s algorithm (since the
  /// firmware buffer was pre-filled with 0xFF).
  int _recalcLocalChecksum() {
    int total = 0;
    int startAddr = 0x800;
    int endAddr = startAddr + 63232; // expected firmware area size
    for (int i = startAddr; i < endAddr; i++) {
      total += _fwBuffer[i];
    }
    return total;
  }

  /// Verifies the checksum by reading the device's response and comparing it to our locally
  /// recalculated checksum.
  Future<bool> _verifySummation() async {
    String? result = await _ble.readStringResponse(
      "firmware query",
      command: _verifyCmd,
      timeout: const Duration(seconds: 2),
    );
    if (result == null || result.isEmpty) {
      _log("No response from device for firmware query.");
      return false;
    }
    String digits = result.replaceAll(RegExp(r'[^0-9-]+'), '');
    int? devSum = int.tryParse(digits);
    if (devSum == null) {
      _log("Failed to parse checksum from '$result'.");
      return false;
    }
    int localSum = _recalcLocalChecksum();
    _log("Device checksum = 0x${devSum.toRadixString(16)} ($devSum), Local checksum = 0x${localSum.toRadixString(16)} ($localSum)");
    return (devSum == localSum);
  }

  bool _parseHexFile(String hexContent) {
    _checksum3 = 0;
    _tempByteCount2 = 0;
    _maxWriteAddr = 0;

    List<String> lines = const LineSplitter().convert(hexContent);
    bool foundData = false;
    for (String line in lines) {
      line = line.trim();
      if (!line.startsWith(":") || line.length < 11) continue;
      int length = int.tryParse(line.substring(1, 3), radix: 16) ?? 0;
      int address = int.tryParse(line.substring(3, 7), radix: 16) ?? 0;
      int recordType = int.tryParse(line.substring(7, 9), radix: 16) ?? 0;
      if (length < 1 || recordType != 0) continue;
      if (address < 0x800) continue; // Skip bootloader area.
      int dataStart = 9;
      int dataEnd = dataStart + (length * 2);
      if (dataEnd > line.length) continue;
      String dataHex = line.substring(dataStart, dataEnd);
      for (int i = 0; i < length; i++) {
        String byteStr = dataHex.substring(i * 2, i * 2 + 2);
        int val = int.tryParse(byteStr, radix: 16) ?? 0;
        int idx = address + i;
        if (idx < kMaxSize) {
          _fwBuffer[idx] = val;
          _checksum3 += val;
          _tempByteCount2++;
          if (idx > _maxWriteAddr) {
            _maxWriteAddr = idx;
          }
          foundData = true;
        }
      }
    }
    return foundData;
  }

  void _finish(bool success) {
    _stopwatch.stop();
    setState(() {
      _isUpdating = false;
      _firmwareReady = false;
    });
    // Re-enable ASCII updates
    _ble.setFirmwareUpdateMode(false);

    final secs = _stopwatch.elapsed.inSeconds;
    if (success) {
      _log("=== Update COMPLETE in $secs seconds ===");
      _showAlert("Firmware Update", "Completed in $secs seconds!");
    } else {
      _log("=== Update FAILED after $secs seconds ===");
      _showAlert("Firmware Update", "Failed after $secs seconds. Try again.");
    }
  }

  void _log(String msg) {
    final line = "[${DateTime.now().toIso8601String()}] $msg";
    debugPrint(line);
    _fwLogs.add(line);
  }

  Future<void> _showAlert(String title, String content) async {
    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.black,
        title: Text(
          title,
          style: const TextStyle(color: Colors.white),
        ),
        content: Text(
          content,
          style: const TextStyle(color: Colors.white),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text(
                "OK",
                style: TextStyle(color: Colors.red),
              )),
        ],
      ),
    );
  }

  /// Allows the user to select a firmware HEX file manually using FileSelector.
  Future<void> _selectFirmwareManually() async {
    final XTypeGroup typeGroup = XTypeGroup(
      label: 'HEX Files',
      extensions: ['hex'],
    );
    final XFile? file = await openFile(
      acceptedTypeGroups: [typeGroup],
      confirmButtonText: 'Select HEX File',
    );
    if (file != null) {
      final content = await file.readAsString();
      setState(() {
        _firmwareFileContent = content;
        _firmwareReady = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Manual firmware file selected and ready for flashing."),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No firmware file selected.")),
      );
    }
  }

  /// Confirmation dialog before flashing firmware.
  Future<void> _confirmAndFlashFirmware() async {
    bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.black,
        title: const Text(
          "Confirm Firmware Update",
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          "ARE YOU SURE?\n\nPlease ensure the JB4PRO is within 5 ft of your phone to avoid bricking the device. The update takes approximately 5 minutes. Proceed with caution.",
          style: TextStyle(fontSize: 16, color: Colors.white),
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("Cancel", style: TextStyle(color: Colors.red)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text("Proceed", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _startFirmwareUpdate();
    }
  }

  /// Prompt the user if they want to proceed despite a checksum mismatch.
  Future<bool> _promptUserToProceed() async {
    bool? proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.black,
        title: const Text(
          "Checksum Mismatch",
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          "The firmware checksum does not match. This may indicate corruption.\n\nDo you want to proceed anyway?",
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("Cancel", style: TextStyle(color: Colors.red)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text("Proceed Anyway", style: TextStyle(color: Colors.green)),
          ),
        ],
      ),
    );
    return proceed ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => !_isUpdating,
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: !_isUpdating,
          title: const Text("Firmware Update"),
          backgroundColor: Colors.black,
          flexibleSpace: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.red, Colors.black],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
        ),
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_isUpdating) ...[
                    Text(
                      _statusMessage,
                      style: const TextStyle(color: Colors.white, fontSize: 18),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "${(_progress * 100).toInt()}%",
                      style: const TextStyle(color: Colors.white, fontSize: 18),
                    ),
                    const SizedBox(height: 10),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: LinearProgressIndicator(
                        value: _progress,
                        backgroundColor: Colors.grey,
                        color: Colors.red,
                      ),
                    ),
                  ] else ...[
                    if (!_firmwareReady) ...[
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                        ),
                        onPressed: () {
                          // Use online firmware (download latest)
                          setState(() {
                            _firmwareFileContent = null;
                            _firmwareReady = true;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Latest firmware is ready for flashing.")),
                          );
                        },
                        child: const Text("Download Latest Firmware Version"),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                        ),
                        onPressed: _selectFirmwareManually,
                        child: const Text("Select Firmware Manually"),
                      ),
                    ] else ...[
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                        ),
                        onPressed: _confirmAndFlashFirmware,
                        child: const Text("Flash Firmware"),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
