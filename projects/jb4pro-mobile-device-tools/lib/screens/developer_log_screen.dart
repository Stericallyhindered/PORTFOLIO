import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/ble_provider.dart';

enum LogViewMode {
  raw,
  parsed,
  bytes,
  errors,
  packets,
}

class DeveloperLogScreen extends StatefulWidget {
  const DeveloperLogScreen({Key? key}) : super(key: key);

  @override
  _DeveloperLogScreenState createState() => _DeveloperLogScreenState();
}

class _DeveloperLogScreenState extends State<DeveloperLogScreen> with SingleTickerProviderStateMixin {
  // Whether log updates are paused.
  bool _logsPaused = false;
  // Snapshot of logs when paused.
  List<String> _pausedLogs = [];
  // Current log view mode
  LogViewMode _viewMode = LogViewMode.raw;
  // Search filter
  String _searchFilter = '';
  // Identifier filter
  String _identifierFilter = '';
  // Tab controller
  late TabController _tabController;
  // Scroll controller for logs
  final ScrollController _scrollController = ScrollController();
  // Auto-scroll enabled
  bool _autoScroll = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(() {
      setState(() {
        switch (_tabController.index) {
          case 0:
            _viewMode = LogViewMode.raw;
            break;
          case 1:
            _viewMode = LogViewMode.parsed;
            break;
          case 2:
            _viewMode = LogViewMode.bytes;
            break;
          case 3:
            _viewMode = LogViewMode.errors;
            break;
          case 4:
            _viewMode = LogViewMode.packets;
            break;
        }
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// Clears the logs in the JB4BleProvider.
  void _clearLogs(JB4BleProvider jb4) {
    jb4.clearLogs();
    if (_logsPaused) {
      setState(() {
        _pausedLogs.clear();
      });
    }
  }

  /// Emails the logs using the url_launcher package.
  Future<void> _emailLogs(JB4BleProvider jb4) async {
    final logs = jb4.logMessages.join('\n');
    final Uri emailLaunchUri = Uri(
      scheme: 'mailto',
      path: 'developer@example.com',
      queryParameters: {
        'subject': 'JB4 Developer Logs',
        'body': logs,
      },
    );
    if (await canLaunchUrl(emailLaunchUri)) {
      await launchUrl(emailLaunchUri);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not launch email client')),
      );
    }
  }

  /// Exports logs to a CSV file
  Future<void> _exportLogsToCSV(JB4BleProvider jb4) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-').replaceAll('.', '-');
      final path = '${directory.path}/jb4_logs_$timestamp.csv';
      final file = File(path);
      
      // Create CSV content
      final buffer = StringBuffer();
      buffer.writeln('Timestamp,Message');
      
      for (final log in jb4.logMessages) {
        // Extract timestamp and message
        final match = RegExp(r'\[(.*?)\] (.*)').firstMatch(log);
        if (match != null) {
          final timestamp = match.group(1);
          final message = match.group(2)?.replaceAll(',', ';'); // Replace commas to avoid CSV issues
          buffer.writeln('$timestamp,"$message"');
        } else {
          buffer.writeln(',${log.replaceAll(',', ';')}');
        }
      }
      
      await file.writeAsString(buffer.toString());
      
      // Share the file
      await Share.shareXFiles([XFile(path)], text: 'JB4 Logs Export');
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Logs exported to $path')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to export logs: $e')),
      );
    }
  }

  /// Pauses log updates by saving a snapshot of the current logs.
  void _pauseLogs(JB4BleProvider jb4) {
    setState(() {
      _logsPaused = true;
      _pausedLogs = jb4.logMessages.toList();
    });
  }

  /// Resumes log updates.
  void _resumeLogs() {
    setState(() {
      _logsPaused = false;
      if (_autoScroll) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      }
    });
  }

  /// Copies all logs to clipboard
  void _copyLogsToClipboard(JB4BleProvider jb4) {
    final logs = jb4.logMessages.join('\n');
    Clipboard.setData(ClipboardData(text: logs));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Logs copied to clipboard')),
    );
  }

  /// Filters logs based on current view mode and search filter
  List<String> _getFilteredLogs(JB4BleProvider jb4) {
    final logs = _logsPaused ? _pausedLogs : jb4.logMessages;
    
    // Apply search filter
    List<String> filteredLogs = logs;
    if (_searchFilter.isNotEmpty) {
      filteredLogs = logs.where((log) => 
        log.toLowerCase().contains(_searchFilter.toLowerCase())).toList();
    }
    
    // Apply view mode filter
    switch (_viewMode) {
      case LogViewMode.raw:
        // Show raw TX/RX data and validation results
        return filteredLogs.where((log) => 
          log.contains("[TX]") || 
          log.contains("[RX]") ||
          log.contains("validation passed") ||
          log.contains("validation failed") ||
          log.contains("settings save result:")).toList();
      
      case LogViewMode.parsed:
        // Show interpreted data and value conversions
        return filteredLogs.where((log) => 
          (log.contains("Identifier") && log.contains("Set")) || 
          log.contains("Parsed") ||
          log.contains("Value") ||
          log.contains("Raw") ||
          log.contains("-> bytes:") ||
          log.contains("Firmware Command") ||
          (log.contains("command") && !log.contains("[TX]") && !log.contains("[RX]"))).toList();
      
      case LogViewMode.bytes:
        // Show byte blocks, raw data, and byte-level details
        return filteredLogs.where((log) => 
          log.contains("[TX]") || 
          log.contains("[RX]") ||
          log.contains("Extended sensor packet") ||
          log.contains("WMI settings packet") ||
          log.contains("MAP1 settings packet") ||
          log.contains("Firmware Update Packet") ||
          log.contains("Enter Bootloader") ||
          log.contains("Erase Flash") ||
          log.contains("Flash Data") ||
          log.contains("Verify Flash") ||
          log.contains("Exit Bootloader") ||
          log.contains("Byte") ||
          log.contains("0x") ||
          log.contains("-> bytes:") ||
          log.contains("-> Raw")).toList();
      
      case LogViewMode.errors:
        // Show errors, validation failures, and save failures
        return filteredLogs.where((log) => 
          log.contains("ERROR") || 
          log.contains("failed") || 
          log.contains("Error") || 
          log.contains("error") ||
          log.contains("validation failed") ||
          log.contains("settings save result: failed") ||
          log.contains("exception") || 
          log.contains("Exception")).toList();
      
      case LogViewMode.packets:
        // Show packet building, validation, and saving
        return filteredLogs.where((log) => 
          log.contains("packet") || 
          log.contains("Packet") || 
          log.contains("Building") ||
          log.contains("validation") ||
          log.contains("settings save result:") ||
          log.contains("Extended sensor packet") || 
          log.contains("WMI settings packet") || 
          log.contains("MAP1 settings packet") ||
          log.contains("Firmware Update Packet") ||
          log.contains("Enter Bootloader") ||
          log.contains("Erase Flash") ||
          log.contains("Flash Data") ||
          log.contains("Verify Flash") ||
          log.contains("Exit Bootloader")).toList();
    }
  }

  /// Builds a widget to visualize a packet byte by byte
  Widget _buildPacketVisualizer(String packetType, int packetSize, Map<int, String> byteDescriptions) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              packetType,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: List.generate(packetSize, (index) {
                final description = byteDescriptions[index] ?? 'Byte $index';
                return Tooltip(
                  message: description,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: _getByteColor(index, packetType),
                      border: Border.all(color: Colors.black),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Center(
                      child: Text(
                        index.toString(),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),
            const Text(
              'Legend:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            Wrap(
              spacing: 8,
              children: [
                if (packetType == 'Firmware Update Packets') ...[
                  _buildLegendItem('Command', Colors.blue.shade100),
                  _buildLegendItem('Address', Colors.orange.shade100),
                  _buildLegendItem('Data', Colors.green.shade100),
                ] else ...[
                  _buildLegendItem('Header', Colors.blue.shade100),
                  _buildLegendItem('RPM Boost', Colors.green.shade100),
                  _buildLegendItem('Advanced Settings', Colors.orange.shade100),
                  _buildLegendItem('Fuel Settings', Colors.purple.shade100),
                  _buildLegendItem('CPS Values', Colors.red.shade100),
                  _buildLegendItem('Checksum/End', Colors.grey.shade300),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Gets a color for a byte based on its position in the packet
  Color _getByteColor(int index, String packetType) {
    if (packetType == 'MAP1 Settings Packet (64 bytes)') {
      if (index == 0 || index == 63) {
        return Colors.grey.shade300; // Header/End
      } else if (index >= 1 && index <= 24) {
        return Colors.green.shade100; // RPM Boost
      } else if (index >= 25 && index <= 39) {
        return Colors.orange.shade100; // Advanced Settings
      } else if (index >= 40 && index <= 48) {
        return Colors.purple.shade100; // Fuel Settings
      } else if (index == 49) {
        return Colors.yellow.shade100; // Six-Cylinder Timing
      } else if (index >= 50 && index <= 61) {
        return Colors.red.shade100; // CPS Values
      } else if (index == 62) {
        return Colors.grey.shade300; // Checksum
      }
    } else if (packetType == 'WMI Settings Packet (26 bytes)') {
      if (index == 0 || index == 25) {
        return Colors.grey.shade300; // Header/End
      } else if (index >= 1 && index <= 6) {
        return Colors.blue.shade100; // WMI Settings
      } else if (index >= 7 && index <= 22) {
        return Colors.green.shade100; // External Output
      } else if (index >= 23 && index <= 24) {
        return Colors.purple.shade100; // Ethanol Setup
      }
    } else if (packetType == 'Extended Sensor Packet (48 bytes)') {
      if (index >= 0 && index <= 23) {
        return Colors.green.shade100; // RPM values
      } else if (index == 24) {
        return Colors.blue.shade100; // TMAP Sensor
      } else if (index == 25) {
        return Colors.orange.shade100; // Boost Limit
      } else if (index >= 26 && index <= 34) {
        return Colors.purple.shade100; // Fuel values
      } else if (index == 35) {
        return Colors.yellow.shade100; // Six-Cylinder Timing
      } else if (index >= 36 && index <= 47) {
        return Colors.red.shade100; // CPS values
      }
    } else if (packetType == 'Firmware Update Packets') {
      if (index == 0) {
        return Colors.blue.shade100; // Command byte
      } else if (index >= 1 && index <= 2) {
        return Colors.orange.shade100; // Address bytes
      } else {
        return Colors.green.shade100; // Data bytes
      }
    }
    return Colors.grey.shade100;
  }

  /// Builds a legend item
  Widget _buildLegendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          color: color,
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<JB4BleProvider>(
      builder: (context, jb4, child) {
        // If logs are paused, show the snapshot; otherwise, show live logs.
        final filteredLogs = _getFilteredLogs(jb4);
        
        // If not paused, update our paused snapshot so if the user pauses later, it's current.
        if (!_logsPaused) {
          _pausedLogs = jb4.logMessages.toList();
          
          // Auto-scroll to bottom if enabled
          if (_autoScroll && filteredLogs.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (_scrollController.hasClients) {
                _scrollController.animateTo(
                  _scrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            });
          }
        }
        
        return Scaffold(
          appBar: AppBar(
            title: const Text('Developer Logs'),
            actions: [
              IconButton(
                icon: const Icon(Icons.email),
                tooltip: 'Email Logs',
                onPressed: () => _emailLogs(jb4),
              ),
              IconButton(
                icon: const Icon(Icons.save_alt),
                tooltip: 'Export Logs to CSV',
                onPressed: () => _exportLogsToCSV(jb4),
              ),
              IconButton(
                icon: const Icon(Icons.copy),
                tooltip: 'Copy Logs to Clipboard',
                onPressed: () => _copyLogsToClipboard(jb4),
              ),
              // Pause/Resume button: show pause icon if logs are live, resume icon if paused.
              IconButton(
                icon: Icon(_logsPaused ? Icons.play_arrow : Icons.pause),
                tooltip: _logsPaused ? 'Resume Logs' : 'Pause Logs',
                onPressed: () {
                  if (_logsPaused) {
                    _resumeLogs();
                  } else {
                    _pauseLogs(jb4);
                  }
                },
              ),
              IconButton(
                icon: const Icon(Icons.clear_all),
                tooltip: 'Clear Logs',
                onPressed: () => _clearLogs(jb4),
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabs: const [
                Tab(text: 'Raw Logs'),
                Tab(text: 'Parsed Values'),
                Tab(text: 'Byte View'),
                Tab(text: 'Errors'),
                Tab(text: 'Packets'),
              ],
            ),
          ),
          body: Column(
            children: [
              // Search and filter bar
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'Search logs...',
                          prefixIcon: Icon(Icons.search),
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                        ),
                        onChanged: (value) {
                          setState(() {
                            _searchFilter = value;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 60,
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'ID',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 8),
                        ),
                        maxLength: 1,
                        buildCounter: (context, {required currentLength, required isFocused, maxLength}) => null,
                        onChanged: (value) {
                          setState(() {
                            _identifierFilter = value;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(_autoScroll ? Icons.vertical_align_bottom : Icons.vertical_align_center),
                      tooltip: _autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled',
                      onPressed: () {
                        setState(() {
                          _autoScroll = !_autoScroll;
                        });
                      },
                    ),
                  ],
                ),
              ),
              
              // Log count
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Showing ${filteredLogs.length} of ${jb4.logMessages.length} logs',
                      style: const TextStyle(fontStyle: FontStyle.italic),
                    ),
                    Text(
                      _logsPaused ? 'PAUSED' : 'LIVE',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _logsPaused ? Colors.red : Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Main log view
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    // Raw Logs
                    _buildLogListView(filteredLogs),
                    
                    // Parsed Values
                    _buildLogListView(filteredLogs),
                    
                    // Byte View
                    _buildLogListView(filteredLogs),
                    
                    // Errors
                    _buildLogListView(filteredLogs),
                    
                    // Packets
                    SingleChildScrollView(
                      child: Column(
                        children: [
                          _buildPacketVisualizer(
                            'MAP1 Settings Packet (64 bytes)',
                            64,
                            {
                              0: 'Header (ASCII R)',
                              1: 'RPM 1500 (High)',
                              2: 'RPM 1500 (Low)',
                              3: 'RPM 2000 (High)',
                              4: 'RPM 2000 (Low)',
                              24: 'RPM 7000 (Low)',
                              25: 'Advanced Settings Start',
                              39: 'Advanced Settings End',
                              40: 'Fuel Settings Start',
                              48: 'Fuel Settings End',
                              49: 'Six-Cylinder Timing',
                              50: 'CPS Values Start',
                              61: 'CPS Values End',
                              62: 'Checksum',
                              63: 'End Marker (ASCII #)',
                            },
                          ),
                          _buildPacketVisualizer(
                            'WMI Settings Packet (26 bytes)',
                            26,
                            {
                              0: 'Header (ASCII T)',
                              1: 'Boost Additive (High)',
                              2: 'Boost Additive (Low)',
                              3: 'Signal Scaling (High)',
                              4: 'Signal Scaling (Low)',
                              5: 'Min Flow Boost (High)',
                              6: 'Min Flow Boost (Low)',
                              7: 'External Output Enabled (High)',
                              8: 'External Output Enabled (Low)',
                              9: 'Min RPM (High)',
                              10: 'Min RPM (Low)',
                              11: 'Max RPM (High)',
                              12: 'Max RPM (Low)',
                              13: 'Virtual Sensor Offset (High)',
                              14: 'Virtual Sensor Offset (Low)',
                              15: 'Min TPS (High)',
                              16: 'Min TPS (Low)',
                              17: 'Min Gear (High)',
                              18: 'Min Gear (Low)',
                              19: 'Min AFR (High)',
                              20: 'Min AFR (Low)',
                              21: 'Min Advance (High)',
                              22: 'Min Advance (Low)',
                              23: 'Ethanol Setup (High)',
                              24: 'Ethanol Setup (Low)',
                              25: 'End Marker (ASCII \$)',
                            },
                          ),
                          _buildPacketVisualizer(
                            'Extended Sensor Packet (48 bytes)',
                            48,
                            {
                              0: 'RPM 1500 (High)',
                              1: 'RPM 1500 (Low)',
                              2: 'RPM 2000 (High)',
                              3: 'RPM 2000 (Low)',
                              22: 'RPM 7000 (High)',
                              23: 'RPM 7000 (Low)',
                              24: 'TMAP Sensor',
                              25: 'Boost Limit 3rd',
                              26: 'Fuel 2500',
                              27: 'Fuel 3000',
                              28: 'Fuel 3500',
                              29: 'Fuel 4000',
                              30: 'Fuel 4500',
                              31: 'Fuel 5000',
                              32: 'Fuel 5500',
                              33: 'Fuel 6000',
                              34: 'Fuel 6500',
                              35: 'Six-Cylinder Timing',
                              36: 'CPS 1500',
                              47: 'CPS 7000',
                            },
                          ),
                          _buildPacketVisualizer(
                            'Firmware Update Packets',
                            32,
                            {
                              0: 'Command (U/E/F/V/X)',
                              1: 'Address High',
                              2: 'Address Low',
                              3: 'Data Start',
                              31: 'Data End',
                            },
                          ),
                          _buildLogListView(filteredLogs),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Builds the log list view
  Widget _buildLogListView(List<String> logs) {
    return ListView.builder(
      controller: _scrollController,
      itemCount: logs.length,
      itemBuilder: (context, index) {
        // Replace any '+' characters with spaces so logs look exactly like the desired format.
        final formattedLog = logs[index].replaceAll('+', ' ');
        
        // Determine if this is an error log
        final isError = formattedLog.contains('ERROR') || 
                        formattedLog.contains('failed') || 
                        formattedLog.contains('Error');
        
        // Determine if this is a packet log
        final isPacket = formattedLog.contains('packet') || 
                         formattedLog.contains('Packet');
        
        // Determine if this is a parsed value log
        final isParsed = formattedLog.contains('Identifier') && 
                         formattedLog.contains('Set');
        
        // Determine if this is a byte log
        final isByte = formattedLog.contains('bytes:') || 
                       formattedLog.contains('Byte');
        
        // Extract timestamp and message
        final match = RegExp(r'\[(.*?)\] (.*)').firstMatch(formattedLog);
        final timestamp = match?.group(1) ?? '';
        final message = match?.group(2) ?? formattedLog;

        // Determine background color based on message type
        Color? bgColor;
        if (message.contains("validation passed")) {
          bgColor = Colors.green.withOpacity(0.1);
        } else if (message.contains("validation failed")) {
          bgColor = Colors.red.withOpacity(0.1);
        } else if (message.contains("Building") && message.contains("packet")) {
          bgColor = Colors.blue.withOpacity(0.1);
        } else if (message.contains("settings save result: success")) {
          bgColor = Colors.green.withOpacity(0.1);
        } else if (message.contains("settings save result: failed")) {
          bgColor = Colors.red.withOpacity(0.1);
        }

        // Format byte values in message
        final formattedMessage = message.replaceAllMapped(
          RegExp(r'0x[0-9A-F]{2}'),
          (match) => '${match.group(0)}',
        );

        return Container(
          color: bgColor,
          child: ListTile(
            dense: true,
            title: RichText(
              text: TextSpan(
                children: [
                  // Timestamp in gray
                  TextSpan(
                    text: '[$timestamp] ',
                    style: TextStyle(
                      fontFamily: 'Courier',
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  // Message with appropriate color
                  TextSpan(
                    text: formattedMessage,
                    style: TextStyle(
                      fontFamily: 'Courier',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isError ? Colors.red[700] :
                             message.contains("[TX]") ? Colors.blue[700] :
                             message.contains("[RX]") ? Colors.green[700] :
                             message.contains("Firmware Command") ? Colors.deepPurple[700] :
                             message.contains("Enter Bootloader") ? Colors.indigo[700] :
                             message.contains("Erase Flash") ? Colors.pink[700] :
                             message.contains("Flash Data") ? Colors.amber[700] :
                             message.contains("Verify Flash") ? Colors.teal[700] :
                             message.contains("Exit Bootloader") ? Colors.deepOrange[700] :
                             message.contains("Byte") ? Colors.purple[700] :
                             message.contains("0x") ? Colors.orange[700] :
                             isPacket ? Colors.blue[700] :
                             isParsed ? Colors.teal[700] :
                             Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
            onTap: () {
              // Copy the log to clipboard when tapped
              Clipboard.setData(ClipboardData(text: formattedLog));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Log copied to clipboard'),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
