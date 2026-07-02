import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart'; // Using url_launcher instead of share_plus
import 'dart:io';
import '../ble_provider.dart';

class LogPage extends StatelessWidget {
  const LogPage({Key? key}) : super(key: key);

  /// Export logs to the Downloads folder
  Future<void> _exportLogs(BuildContext context, List<String> logs) async {
    try {
      // Check for storage permission (only needed for Android < API 29)
      if (Platform.isAndroid) { // Scoped storage applies to Android
        if (await Permission.storage.request().isDenied) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Storage permission is required")),
          );
          return;
        }
      }

      // Get the directory for the Downloads folder
      Directory? downloadsDir;

      if (Platform.isAndroid) {
        downloadsDir = Directory('/storage/emulated/0/Download');
      } else if (Platform.isIOS) {
        downloadsDir = await getApplicationDocumentsDirectory();
      } else {
        // Handle other platforms if necessary
        downloadsDir = await getDownloadsDirectory();
      }

      if (downloadsDir == null || !downloadsDir.existsSync()) {
        throw Exception('Downloads directory does not exist.');
      }

      // Create a log file in the Downloads folder
      final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
      final filePath = '${downloadsDir.path}/logs_$timestamp.txt';
      final file = File(filePath);

      // Write logs to the file
      await file.writeAsString(logs.join('\n'));

      // Notify user about successful export
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Logs exported to $filePath")),
      );

      // Log the export action
      final bleProvider = context.read<BleProvider>();
      bleProvider.addLogMessage("Logs exported to $filePath.");
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error exporting logs: $e")),
      );

      // Log the error
      final bleProvider = context.read<BleProvider>();
      bleProvider.addLogMessage("Error exporting logs: $e");
    }
  }

  /// Send logs via email using mailto: link
  Future<void> _sendLogsByEmail(BuildContext context, List<String> logs) async {
    try {
      // Combine all logs into a single string
      final String logContent = logs.join('\n');

      // Encode the log content to ensure it's URL-safe
      final String encodedLog = Uri.encodeComponent(logContent);

      // Create the mailto: link
      final Uri emailUri = Uri(
        scheme: 'mailto',
        path: '', // Let the user choose the recipient
        queryParameters: {
          'subject': 'CANFLEX Logs Export :: ${DateTime.now()}',
          'body': 'Please find the CANFLEX logs below:\n\n$logContent',
        },
      );

      // Launch the email client
      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri);
        // Log the email action
        final bleProvider = context.read<BleProvider>();
        bleProvider.addLogMessage("Logs emailed successfully.");
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("No email client found.")),
        );

        // Log the failure
        final bleProvider = context.read<BleProvider>();
        bleProvider.addLogMessage("Failed to launch email client.");
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error sending logs via email: $e")),
      );

      // Log the error
      final bleProvider = context.read<BleProvider>();
      bleProvider.addLogMessage("Error sending logs via email: $e");
    }
  }

  /// Show a loading dialog with a message
  void _showLoadingDialog(BuildContext context, String message) {
    showDialog(
      context: context,
      barrierDismissible: false, // Prevents closing the dialog by tapping outside
      builder: (context) => AlertDialog(
        title: Text(message),
        content: Row(
          children: const [
            CircularProgressIndicator(),
            SizedBox(width: 20),
            Expanded(child: Text('Please wait...')),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    var bleProvider = context.watch<BleProvider>();

    // Display all logs for comprehensive visibility
    List<String> allLogs = bleProvider.logs;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings Log Console'),
        backgroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              // Optional: Implement log refresh functionality if needed
              // Currently, logs are updated in real-time via provider
              bleProvider.addLogMessage("Refresh Logs button clicked.");
            },
            tooltip: 'Refresh Logs',
          ),
        ],
      ),
      backgroundColor: Colors.black,
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: allLogs.isNotEmpty
                  ? ListView.builder(
                      itemCount: allLogs.length,
                      itemBuilder: (context, index) {
                        final logEntry = allLogs[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2.0),
                          child: Text(
                            logEntry,
                            style: const TextStyle(color: Colors.white),
                          ),
                        );
                      },
                    )
                  : const Center(
                      child: Text(
                        'No logs available.',
                        style: TextStyle(color: Colors.white, fontSize: 16),
                      ),
                    ),
            ),
          ),
          const Divider(color: Colors.white),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 20.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Export Logs Button
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                  ),
                  onPressed: () async {
                    _showLoadingDialog(context, 'Exporting logs...');
                    await _exportLogs(context, allLogs);
                    Navigator.of(context).pop(); // Close the loading dialog
                  },
                  icon: const Icon(Icons.download),
                  label: const Text('Export Logs'),
                ),
                // Email Logs Button
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                  ),
                  onPressed: () async {
                    _showLoadingDialog(context, 'Preparing logs for email...');
                    await _sendLogsByEmail(context, allLogs);
                    Navigator.of(context).pop(); // Close the loading dialog
                  },
                  icon: const Icon(Icons.email),
                  label: const Text('Email Logs'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
