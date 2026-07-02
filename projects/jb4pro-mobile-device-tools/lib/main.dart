// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';

// Import your screens
import 'gauge_screen.dart';
import 'logging_screen.dart';
import 'user_adjustment_screen.dart';
import 'settings_screen.dart';
import 'screens/developer_log_screen.dart';
import 'screens/firmware_screen.dart';

// Import your providers
import 'gauge_visibility_provider.dart';
import 'providers/ble_provider.dart';

/// Requests the necessary permissions.
Future<void> requestPermissions() async {
  List<Permission> permissions = [
    Permission.bluetoothScan,
    Permission.bluetoothConnect,
    Permission.location,
    Permission.storage,
  ];

  for (var permission in permissions) {
    if (await permission.isDenied) {
      await permission.request();
    }
  }

  for (var permission in permissions) {
    if (await permission.isPermanentlyDenied) {
      await permission.request();
    }
  }
}

/// Default gauge visibility map.
Map<String, bool> _defaultGaugeVisibility() {
  return {
    'RPM': true,
    'Boost': true,
    'Boost2': true,
    'TPS': true,
    'Map Selection': true,
    'IAT (Intake Temp)': true,
    'Water Temp': true,
    'Oil Temp': true,
    'E85 Content': true,
    'Trans Temp': true,
    'Clock': false,
    'PWM': true,
    'Fuel': false, // Not in the user's list, setting to false
    'Fuel Pressure': true,
    'EGT (Exhaust Temp)': true,
    'Trim2': true,
    'Gear': true,
    'Speed': true,
    'AFR': true,
    'Methanol': false,
    'FFPID': false,
    'AFR2': true,
    'DME Boost': true,
    'Ignition Adv': false,
    'Avg Ignition': true,
    'Ign Drop': false,
    'DME Target': true,
    'VIN': false,
    'M1 PID Gain': false,
    'M1 Throttle': false,
    'M1 Lag Fix': false,
    'M1 Boost Limit': false,
    'Feed Forward': false,
    '1st Boost Limit': false,
    '2nd Boost Limit': false,
    'M1 Meth Hard': false,
    'Meth Range': false,
    'Meth Trigger': false,
    'Fuel Pressure (2nd)': false,
    'Firmware Version': false,
    'N1 Min PSI': false,
    'N1 Enabled': false,
    'E85 Bits': false,
    'N1 Min RPM': false,
    'N1 Max RPM': false,
    'N1 Ramp Rate': false,
    'Virtual FF Offset': false,
    'Open Loop': false,
    'Meth Safety': false,
    'CPS (Crank Sensor)': false,
    'Acceleration': false,
    'N1 Min Gear': false,
    'N1 Min AFR': false,
    'N1 Min Advance': false,
    'KR1': false,
    'KR2': false,
    'KR3': false,
    'KR4': false,
    'KR5': false,
    'KR6': false,
    'KR7': false,
    'KR8': false,
    'Aux 1': false,
    'Aux 2': false,
    'Aux 3': false,
    'Aux 4': false,
    'Aux 5': false,
    'Aux 6': false,
    'MAF Sensor 1': false,
    'MAF Sensor 2': false,
  };
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  // Build the MaterialApp with our custom theme, navigation, and routes.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JB4 PRO Flutter',
      theme: _buildFuriTheme(),
      home: const MainHome(),
      routes: {
        '/firmware': (context) => const FirmwareScreen(),
      },
    );
  }

  // Furi Dark/Red Theme
  ThemeData _buildFuriTheme() {
    final base = ThemeData.dark();
    return base.copyWith(
      primaryColor: const Color(0xFFE53935),
      colorScheme: base.colorScheme.copyWith(
        primary: const Color(0xFFE53935),
        secondary: const Color(0xFFFFC107),
      ),
      scaffoldBackgroundColor: const Color(0xFF121212),
      appBarTheme: base.appBarTheme.copyWith(
        color: const Color(0xFF121212),
        iconTheme: const IconThemeData(color: Colors.white),
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE53935),
          foregroundColor: Colors.white,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: const Color(0xFFE53935),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      cardColor: const Color(0xFF1E1E1E),
      cardTheme: base.cardTheme.copyWith(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      inputDecorationTheme: base.inputDecorationTheme.copyWith(
        filled: true,
        fillColor: const Color(0xFF1E1E1E),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        hintStyle: const TextStyle(color: Colors.grey),
      ),
      textTheme: _buildFuriTextTheme(base.textTheme),
    );
  }

  TextTheme _buildFuriTextTheme(TextTheme base) {
    return base.copyWith(
      displayLarge: base.displayLarge?.copyWith(
        fontFamily: 'Roboto',
        color: Colors.white,
        fontSize: 32,
        fontWeight: FontWeight.bold,
      ),
      headlineSmall: base.headlineSmall?.copyWith(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
      bodyMedium: base.bodyMedium?.copyWith(
        color: Colors.white70,
        fontSize: 14,
      ),
    );
  }
}

class MainHome extends StatefulWidget {
  const MainHome({Key? key}) : super(key: key);

  @override
  State<MainHome> createState() => _MainHomeState();
}

class _MainHomeState extends State<MainHome> {
  int _currentIndex = 0;
  int _selectedMap = 0;

  final List<Widget> _screens = [
    const GaugeScreen(),
    const LoggingScreen(),
    const UserAdjustmentScreen(),
    const SettingsScreen(),
    const DeveloperLogScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<JB4BleProvider>(
      builder: (context, bleProvider, child) {
        // Update _selectedMap from device if needed
        if (bleProvider.mapSelection.isNotEmpty) {
          int deviceMap = int.tryParse(bleProvider.mapSelection) ?? 0;
          if (_selectedMap != deviceMap - 1) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              setState(() {
                _selectedMap = deviceMap - 1;
              });
            });
          }
        }
        
        return Scaffold(
          appBar: AppBar(
            title: Text(_getScreenTitle()),
            actions: [
              // Map selector in the AppBar
              Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Map: ', style: TextStyle(color: Colors.white)),
                    DropdownButton<int>(
                      value: _selectedMap,
                      dropdownColor: Colors.black87,
                      style: const TextStyle(color: Colors.white),
                      underline: Container(
                        height: 2,
                        color: const Color(0xFFE53935),
                      ),
                      items: List.generate(8, (index) {
                        return DropdownMenuItem(
                          value: index,
                          child: Text(
                            '${index + 1}',
                            style: const TextStyle(color: Colors.white),
                          ),
                        );
                      }),
                      onChanged: (val) async {
                        if (val != null) {
                          setState(() {
                            _selectedMap = val;
                          });
                          
                          // Send map change command
                          bleProvider.addLog("Map selection changed to ${val + 1}");
                          
                          // Send map change command as ASCII "M" + map number
                          String mapCommand = "M${val + 1}";
                          await bleProvider.sendAsciiCommand(mapCommand);
                          bleProvider.addLog("Sent map change command: '$mapCommand'");
                          
                          // Request settings update
                          await Future.delayed(const Duration(milliseconds: 500));
                          await bleProvider.sendAsciiCommand("\$");
                          await Future.delayed(const Duration(milliseconds: 50));
                          await bleProvider.sendAsciiCommand("#");
                          await Future.delayed(const Duration(milliseconds: 50));
                          await bleProvider.sendAsciiCommand("C");
                          await Future.delayed(const Duration(milliseconds: 50));
                          await bleProvider.sendAsciiCommand("J");
                          bleProvider.addLog("Requested settings update after map change");
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          body: _screens[_currentIndex],
          bottomNavigationBar: BottomAppBar(
            color: const Color(0xFF121212),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _navBarItem(icon: Icons.speed, label: 'Gauges', index: 0),
                _navBarItem(icon: Icons.analytics, label: 'Logging', index: 1),
                _navBarItem(icon: Icons.tune, label: 'Adjust', index: 2),
                _navBarItem(icon: Icons.settings, label: 'Settings', index: 3),
                _navBarItem(icon: Icons.developer_mode, label: 'Dev Logs', index: 4),
              ],
            ),
          ),
        );
      },
    );
  }

  // Get the title for the current screen
  String _getScreenTitle() {
    switch (_currentIndex) {
      case 0:
        return 'JB4 Gauges';
      case 1:
        return 'Data Logging';
      case 2:
        return 'User Adjustments';
      case 3:
        return 'Settings';
      case 4:
        return 'Developer Logs';
      default:
        return 'JB4 PRO';
    }
  }

  Widget _navBarItem({
    required IconData icon,
    required String label,
    required int index,
  }) {
    return IconButton(
      icon: Icon(icon, color: Colors.white),
      onPressed: () {
        setState(() {
          _currentIndex = index;
        });
      },
      tooltip: label,
    );
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await requestPermissions();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => GaugeVisibilityProvider(
            gaugeVisibility: _defaultGaugeVisibility(),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => JB4BleProvider(),
        ),
      ],
      child: const MyApp(),
    ),
  );
}
