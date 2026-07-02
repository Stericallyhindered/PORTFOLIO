// lib/main.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'screens/main_screen.dart'; // Start directly with MainScreen
import 'screens/settings_page.dart';
import 'screens/log_page.dart'; // Log Page for detailed error reporting
import 'package:canflexbasic/ble_provider.dart';


void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // Ensure widget binding is initialized before any asynchronous code runs.

  // Request necessary permissions before launching the app
  await requestPermissions();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => BleProvider()),
      ],
      child: const CanflexApp(),
    ),
  );
}

class CanflexApp extends StatelessWidget {
  const CanflexApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'CANflex',
      theme: ThemeData(
        primaryColor: Colors.black,
        brightness: Brightness.dark,
      ),
      home: const MainScreen(), // Start directly with MainScreen
      routes: {
        '/settings': (context) => const SettingsPage(),
        '/logs': (context) => const LogPage(), // Logs page route
      },
      builder: (context, child) {
        return Consumer<BleProvider>(
          builder: (context, bleProvider, _) {
            if (bleProvider.errorMessage.isNotEmpty) {
              // To prevent multiple dialogs, check if a dialog is already being shown
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (ModalRoute.of(context)?.isCurrent == true) {
                  showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return AlertDialog(
                        title: const Text('Error'),
                        content: Text(bleProvider.errorMessage),
                        actions: [
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                              bleProvider.setErrorMessage(''); // Clear error message after dismissing
                            },
                            child: const Text('OK'),
                          ),
                        ],
                      );
                    },
                  );
                }
              });
            }
            return child!;
          },
        );
      },
    );
  }
}

Future<void> requestPermissions() async {
  // List of permissions to request
  List<Permission> permissions = [
    Permission.bluetoothScan,
    Permission.bluetoothConnect,
    Permission.location,
    Permission.storage, // Needed for exporting logs
  ];

  // Check and request each permission
  for (var permission in permissions) {
    if (await permission.isDenied) {
      await permission.request();
    }
  }

  // Optional: Handle permission permanently denied
  for (var permission in permissions) {
    if (await permission.isPermanentlyDenied) {
      // You can open app settings or inform the user to manually enable permissions
      await permission.request();
    }
  }
}
