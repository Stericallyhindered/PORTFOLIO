import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'gauge_visibility_provider.dart';
import 'providers/ble_provider.dart'; // This file defines JB4BleProvider
import 'custom_gauge_widget.dart'; // Import our custom gauge widget

class GaugeScreen extends StatefulWidget {
  const GaugeScreen({Key? key}) : super(key: key);

  @override
  State<GaugeScreen> createState() => _GaugeScreenState();
}

class _GaugeScreenState extends State<GaugeScreen> with WidgetsBindingObserver {
  // Timer to periodically check if gauges are updating
  Timer? _gaugeUpdateTimer;
  // Store the last RPM value to detect if gauges are updating
  String _lastRpmValue = "0";
  // Counter for how many checks have passed without gauge updates
  int _noUpdateCounter = 0;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    
    // Start logging after the frame is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final jb4 = Provider.of<JB4BleProvider>(context, listen: false);
        jb4.startLogging();
        
        // Start a timer to check if gauges are updating
        _startGaugeUpdateTimer();
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Stop logging when we leave the screen
    final jb4 = Provider.of<JB4BleProvider>(context, listen: false);
    jb4.stopLogging();
    
    // Cancel the gauge update timer
    _gaugeUpdateTimer?.cancel();
    _gaugeUpdateTimer = null;
    
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    final jb4 = Provider.of<JB4BleProvider>(context, listen: false);
    
    // Handle app lifecycle changes
    switch (state) {
      case AppLifecycleState.resumed:
        // App is in the foreground
        jb4.addLog("App resumed - restarting logging");
        jb4.startLogging();
        _startGaugeUpdateTimer();
        break;
      case AppLifecycleState.paused:
        // App is partially obscured
        jb4.addLog("App paused - stopping gauge update timer");
        _gaugeUpdateTimer?.cancel();
        break;
      case AppLifecycleState.inactive:
        // App is in an inactive state
        break;
      case AppLifecycleState.detached:
        // App is detached
        jb4.addLog("App detached - stopping logging");
        jb4.stopLogging();
        _gaugeUpdateTimer?.cancel();
        break;
      default:
        break;
    }
  }
  
  void _startGaugeUpdateTimer() {
    // Cancel any existing timer
    _gaugeUpdateTimer?.cancel();
    
    // Create a new timer that checks every 5 seconds if gauges are updating
    _gaugeUpdateTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      final jb4 = Provider.of<JB4BleProvider>(context, listen: false);
      
      // Check if we're connected
      if (jb4.status != "Connected") {
        return;
      }
      
      // Check if RPM value has changed
      if (jb4.rpm == _lastRpmValue) {
        _noUpdateCounter++;
        jb4.addLog("Gauge update check: No change detected ($_noUpdateCounter/3)");
        
        // If no updates for 15 seconds (3 checks), try to restart logging
        if (_noUpdateCounter >= 3) {
          jb4.addLog("Gauges not updating for 15 seconds - restarting logging");
          _restartLogging(jb4);
          _noUpdateCounter = 0;
        }
      } else {
        // RPM has changed, reset counter
        _noUpdateCounter = 0;
        _lastRpmValue = jb4.rpm;
        jb4.addLog("Gauge update check: RPM changed to $_lastRpmValue");
      }
    });
  }
  
  Future<void> _restartLogging(JB4BleProvider jb4) async {
    try {
      // Stop logging
      await jb4.stopLogging();
      
      // Wait a moment
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Start logging again
      await jb4.startLogging();
      
      jb4.addLog("Logging restarted successfully");
    } catch (e) {
      jb4.addLog("Error restarting logging: $e");
    }
  }

  /// Builds a list of gauge maps (each with a label and value) from the JB4BleProvider.
  List<Map<String, String>> _buildGaugeList(JB4BleProvider jb4) {
    return [
      {'label': 'RPM',               'value': jb4.rpm},
      {'label': 'Boost',             'value': "${jb4.boost} PSI"},
      {'label': 'Boost2',            'value': "${jb4.boost2} PSI"},
      {'label': 'TPS',               'value': jb4.tps},
      {'label': 'Map Selection',     'value': jb4.mapSelection},
      {'label': 'IAT (Intake Temp)', 'value': jb4.iat},
      {'label': 'Water Temp',        'value': jb4.waterTemp},
      {'label': 'Oil Temp',          'value': jb4.oilTemp},
      {'label': 'E85 Content',       'value': jb4.e85},
      {'label': 'Trans Temp',        'value': jb4.transTemp},
      {'label': 'Clock',             'value': jb4.clockValue},
      {'label': 'PWM',               'value': jb4.pwm},
      {'label': 'Fuel',              'value': jb4.fuel},
      {'label': 'Fuel Pressure',     'value': jb4.fuelPressure},
      {'label': 'EGT (Exhaust Temp)','value': jb4.egt},
      {'label': 'Trim2',             'value': jb4.trims2},
      {'label': 'Gear',              'value': jb4.gear},
      {'label': 'Speed',             'value': jb4.speed},
      {'label': 'AFR',               'value': jb4.afr},
      {'label': 'Methanol',          'value': jb4.meth},
      {'label': 'FFPID',             'value': jb4.ffPid},
      {'label': 'AFR2',              'value': jb4.afr2},
      {'label': 'DME Boost',         'value': "${jb4.dmeBoost} PSI"},
      {'label': 'Ignition Adv',      'value': jb4.ignitionAdv},
      {'label': 'Avg Ignition',      'value': jb4.avgIgn},
      {'label': 'Ign Drop',          'value': jb4.avgIgnDrop},
      {'label': 'DME Target',        'value': "${jb4.dmeTarget} PSI"},
      {'label': 'VIN',               'value': jb4.vin},
      {'label': 'M1 PID Gain',       'value': jb4.m1PidGain},
      {'label': 'M1 Throttle',       'value': jb4.m1Throttle},
      {'label': 'M1 Lag Fix',        'value': jb4.m1LagFix},
      {'label': 'M1 Boost Limit',    'value': "${jb4.m1BoostLimit} PSI"},
      {'label': 'Feed Forward',      'value': jb4.feedForward},
      {'label': '1st Boost Limit',   'value': "${jb4.boostLimit1st} PSI"},
      {'label': '2nd Boost Limit',   'value': "${jb4.boostLimit2nd} PSI"},
      {'label': 'M1 Meth Hard',      'value': jb4.m1MethHard},
      {'label': 'Meth Range',        'value': jb4.methRange},
      {'label': 'Meth Trigger',      'value': jb4.methTrigger},
      {'label': 'Firmware Version',  'value': jb4.jb4Firmware},
      {'label': 'N1 Min PSI',        'value': jb4.n1MinPsi},
      {'label': 'N1 Enabled',        'value': jb4.n1Enabled},
      {'label': 'E85 Bits',          'value': jb4.e85Bits.toString()},
      {'label': 'N1 Min RPM',        'value': jb4.n1MinRpm},
      {'label': 'N1 Max RPM',        'value': jb4.n1MaxRpm},
      {'label': 'N1 Ramp Rate',      'value': jb4.n1RampRate},
      {'label': 'Virtual FF Offset', 'value': jb4.virtualFfOffset},
      {'label': 'Open Loop',         'value': jb4.openLoop},
      {'label': 'Meth Safety',       'value': jb4.methSafety},
      {'label': 'CPS (Crank Sensor)', 'value': jb4.cpsValue},
      {'label': 'Acceleration',      'value': jb4.accel},
      {'label': 'N1 Min Gear',       'value': jb4.n1MinGear},
      {'label': 'N1 Min AFR',        'value': jb4.n1MinAfr},
      {'label': 'N1 Min Advance',    'value': jb4.n1MinAdvance},
      {'label': 'KR1',               'value': jb4.kr1},
      {'label': 'KR2',               'value': jb4.kr2},
      {'label': 'KR3',               'value': jb4.kr3},
      {'label': 'KR4',               'value': jb4.kr4},
      {'label': 'KR5',               'value': jb4.kr5},
      {'label': 'KR6',               'value': jb4.kr6},
      {'label': 'KR7',               'value': jb4.kr7},
      {'label': 'KR8',               'value': jb4.kr8},
      {'label': 'Aux 1',             'value': jb4.aux1},
      {'label': 'Aux 2',             'value': jb4.aux2},
      {'label': 'Aux 3',             'value': jb4.aux3},
      {'label': 'Aux 4',             'value': jb4.aux4},
      {'label': 'Aux 5',             'value': jb4.aux5},
      {'label': 'Aux 6',             'value': jb4.aux6},
      {'label': 'MAF Sensor 1',      'value': jb4.maf1},
      {'label': 'MAF Sensor 2',      'value': jb4.maf2},
    ];
  }

  /// Builds a single gauge widget.
  Widget _buildGauge(String label, String value) {
    // Determine appropriate min/max values based on the label
    double min = 0;
    double max = 100;
    
    // Set appropriate min/max ranges for different gauge types
    if (label == 'RPM') {
      max = 8000;
    } else if (label.contains('Boost')) {
      min = -10;
      max = 30;
    } else if (label == 'TPS') {
      max = 100;
    } else if (label.contains('Temp')) {
      min = -20;
      max = 200;
    } else if (label.contains('AFR')) {
      min = 8;
      max = 18;
    } else if (label == 'Speed') {
      max = 200;
    }
    
    return CustomGauge(
      label: label,
      value: value,
      min: min,
      max: max,
      providedValue: double.tryParse(value.replaceAll(RegExp(r'[^\d.-]'), '')),
      gaugeColors: const [Color(0xFF8B0000), Color(0xFFE53935)],
      textColor: Colors.white,
      valueTextColor: Colors.white,
    );
  }

  @override
  Widget build(BuildContext context) {
    final jb4 = Provider.of<JB4BleProvider>(context);
    final gaugeVisibilityProvider = Provider.of<GaugeVisibilityProvider>(context);

    // Build the entire gauge list from the JB4 provider:
    final allGauges = _buildGaugeList(jb4);

    // Filter by your gauge visibility map
    final visibleGauges = allGauges.where((g) {
      return gaugeVisibilityProvider.isVisible(g['label']!);
    }).toList();

    // Calculate optimal gauge layout
    final screenWidth = MediaQuery.of(context).size.width;
    final gaugeWidth = 110.0; // Width of each gauge including spacing
    final maxGaugesPerRow = (screenWidth / gaugeWidth).floor();
    final optimalGaugesPerRow = _calculateOptimalGaugesPerRow(visibleGauges.length, maxGaugesPerRow);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gauges'),
        actions: [
          // Connect/Disconnect button with status icon:
          IconButton(
            icon: Icon(
              jb4.status == "Connected"
                  ? Icons.bluetooth_connected
                  : Icons.bluetooth_disabled,
              color: jb4.status == "Connected" ? Colors.green : Colors.red,
            ),
            tooltip: jb4.status == "Connected" ? "Disconnect" : "Connect",
            onPressed: () {
              if (jb4.status == "Connected") {
                jb4.disconnect();
              } else {
                jb4.scanAndConnect();
              }
            },
          ),
          // Logs button
          IconButton(
            icon: const Icon(Icons.list),
            tooltip: 'Show Logs',
            onPressed: () {
              // Navigate to the logs screen (ensure route "/logs" is defined)
              Navigator.pushNamed(context, '/logs');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Only keep the demo mode button
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    textStyle: const TextStyle(fontSize: 12),
                  ),
                  onPressed: () {
                    // Send the byte command 0x49 to toggle demo mode.
                    jb4.sendCommandWithoutResponsePublic([0x49]);
                  },
                  child: const Text("Demo Mode"),
                ),
              ],
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              child: Padding(
                padding: const EdgeInsets.all(10.0),
                child: SingleChildScrollView(
                  child: Center(
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        return _buildOrganizedGaugeGrid(
                          visibleGauges, 
                          optimalGaugesPerRow,
                          constraints.maxWidth
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Calculates the optimal number of gauges per row for the most balanced layout
  int _calculateOptimalGaugesPerRow(int totalGauges, int maxPerRow) {
    if (totalGauges <= maxPerRow) return totalGauges;
    
    // Try to find a divisor of totalGauges that is <= maxPerRow
    for (int i = maxPerRow; i >= 2; i--) {
      if (totalGauges % i == 0) return i;
    }
    
    // If no exact divisor, find the number that minimizes the empty space in the last row
    int bestGaugesPerRow = maxPerRow;
    int minRemainder = totalGauges % maxPerRow;
    
    if (minRemainder == 0) return maxPerRow;
    
    // Try different values to minimize the remainder
    for (int i = maxPerRow - 1; i >= 2; i--) {
      int remainder = totalGauges % i;
      if (remainder == 0) return i;
      
      // If this remainder is better than our current best, update
      if (remainder > minRemainder || (i - remainder) < (bestGaugesPerRow - minRemainder)) {
        minRemainder = remainder;
        bestGaugesPerRow = i;
      }
    }
    
    return bestGaugesPerRow;
  }
  
  /// Builds a grid of gauges that are organized in rows with equal number of gauges per row
  Widget _buildOrganizedGaugeGrid(List<Map<String, String>> gauges, int gaugesPerRow, double maxWidth) {
    // If no gauges, return empty container
    if (gauges.isEmpty) {
      return Container();
    }
    
    // Calculate the width of each gauge to fit exactly gaugesPerRow per row
    final double spacing = 10.0;
    final double totalSpacing = spacing * (gaugesPerRow - 1);
    final double gaugeWidth = (maxWidth - totalSpacing) / gaugesPerRow;
    
    // Create rows of gauges
    List<Widget> rows = [];
    for (int i = 0; i < gauges.length; i += gaugesPerRow) {
      // Get the gauges for this row
      final rowGauges = gauges.skip(i).take(gaugesPerRow).toList();
      
      // Create a row with these gauges
      rows.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 15.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: rowGauges.map((gaugeData) {
              final label = gaugeData['label']!;
              final value = gaugeData['value']!;
              return SizedBox(
                width: gaugeWidth,
                child: _buildGauge(label, value),
              );
            }).toList(),
          ),
        ),
      );
    }
    
    return Column(
      children: rows,
    );
  }
}
