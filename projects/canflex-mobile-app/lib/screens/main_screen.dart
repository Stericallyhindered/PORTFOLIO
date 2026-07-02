import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sleek_circular_slider/sleek_circular_slider.dart'; // Ensure this package is in pubspec.yaml
import '../ble_provider.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  bool _isDataPaused = false;
  bool _exitBootSent = false; // New flag to ensure we send exit bootloader only once

  // Existing fields tracking the 0x41 data:
  double _lastEthanolValue = 0.0;
  String _lastFuelTemp = '--°F';
  String _lastFuelPressure = '-- PSI';

  // New fields for 0x42 data:
  String _lastRpm = '--';
  String _lastSpeed = '--';
  String _lastCoolantTemp = '--°F';
  String _lastOilTemp = '--°F';
  String _lastGear = '--';
  String _lastTorque = '--';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final bleProvider = context.read<BleProvider>();
      if (bleProvider.status == "Connected" && !_isDataPaused) {
        // Ensure the device is out of bootloader mode on connect:
        if (!_exitBootSent) {
          bool exitOk = await bleProvider.sendCommandWithoutResponsePublic(
              [0x59, 0x58, 0x0D, 0x0A, 0x00]);
          if (exitOk) {
            bleProvider.addLogMessage("Exit bootloader command sent successfully on MainScreen.");
          } else {
            bleProvider.addLogMessage("Failed to send exit bootloader command on MainScreen.");
          }
          _exitBootSent = true;
        }
        await bleProvider.resumeDataRequests();
      }
    });
  }

  @override
  void dispose() {
    final bleProvider = context.read<BleProvider>();
    if (!_isDataPaused) {
      bleProvider.pauseDataRequests();
    }
    super.dispose();
  }

  /// Updates our local "last known" data fields from BleProvider if they changed
  void _updateData(BleProvider bleProvider) {
    // Handle ethanol content
    if (bleProvider.ethanolContent != 'E--') {
      // Convert "E50" => numeric 50.0 (or fallback 0.0)
      final numericPart = bleProvider.ethanolContent.replaceAll('E', '');
      double val = 0.0;
      try {
        val = double.parse(numericPart);
      } catch (_) {
        val = 0.0;
      }
      _lastEthanolValue = val;
    }

    // Fuel temp
    if (bleProvider.fuelTemperature != _lastFuelTemp) {
      _lastFuelTemp = bleProvider.fuelTemperature;
    }

    // Fuel pressure
    if (bleProvider.fuelPressure != _lastFuelPressure) {
      _lastFuelPressure = bleProvider.fuelPressure;
    }

    // --- NEW 0x42 fields ---
    // RPM
    if (bleProvider.rpm != _lastRpm) {
      _lastRpm = bleProvider.rpm;
    }
    // Speed
    if (bleProvider.speed != _lastSpeed) {
      _lastSpeed = bleProvider.speed; // e.g. "45"
    }
    // Coolant Temp
    if (bleProvider.coolantTemp != _lastCoolantTemp) {
      _lastCoolantTemp = bleProvider.coolantTemp; // e.g. "180°F"
    }
    // Oil Temp
    if (bleProvider.oilTemp != _lastOilTemp) {
      _lastOilTemp = bleProvider.oilTemp;
    }
    // Gear
    if (bleProvider.gear != _lastGear) {
      _lastGear = bleProvider.gear;
    }
    // Torque
    if (bleProvider.torque != _lastTorque) {
      _lastTorque = bleProvider.torque; // e.g. "150"
    }
  }

  @override
  Widget build(BuildContext context) {
    var bleProvider = context.watch<BleProvider>();
    
    // If disconnected, reset the flag so that when reconnected, the exit bootloader command is sent.
    if (bleProvider.status != "Connected") {
      _exitBootSent = false;
    }
    
    _updateData(bleProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Image.asset('assets/images/logo.png', height: 80),
        backgroundColor: Colors.black,
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 10.0),
            child: Icon(
              bleProvider.status == "Connected" ? Icons.wifi : Icons.wifi_off,
              color: bleProvider.status == "Connected" ? Colors.green : Colors.red,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () async {
              if (bleProvider.status == "Connected") {
                bleProvider.addLogMessage("Settings button clicked.");
                await bleProvider.pauseDataRequests();
                setState(() {
                  _isDataPaused = true;
                });

                // Fetch device settings before navigating
                await bleProvider.fetchDeviceSettings();
                await Navigator.pushNamed(context, '/settings');

                // Resume data requests
                await bleProvider.resumeDataRequests();
                setState(() {
                  _isDataPaused = false;
                });
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Connect to a device first.")),
                );
                bleProvider.addLogMessage("Attempted to open Settings without connection.");
              }
            },
            tooltip: 'Settings',
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Ethanol slider/gauge
              SleekCircularSlider(
                appearance: CircularSliderAppearance(
                  customWidths: CustomSliderWidths(
                    progressBarWidth: 15,
                    trackWidth: 8,
                  ),
                  customColors: CustomSliderColors(
                    progressBarColor: Colors.green,
                    trackColor: Colors.grey[800]!,
                    hideShadow: true,
                  ),
                  size: 180,
                  infoProperties: InfoProperties(
                    mainLabelStyle: const TextStyle(
                      color: Colors.green,
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                    ),
                    modifier: (double value) {
                      return '${value.toStringAsFixed(0)}%';
                    },
                  ),
                ),
                min: 0,
                max: 100,
                initialValue: _lastEthanolValue,
                onChange: (double value) {
                  // Not changing anything in real time
                },
              ),
              const SizedBox(height: 10),
              const Text('Ethanol Content', style: TextStyle(color: Colors.white, fontSize: 20)),
              const SizedBox(height: 30),

              // Row for Fuel Temp / Fuel Pressure
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Column(
                    children: [
                      Text(
                        _lastFuelTemp != '--°F' ? _lastFuelTemp : 'N/A',
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('Fuel Temp', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                  Column(
                    children: [
                      Text(
                        _lastFuelPressure != '-- PSI' ? _lastFuelPressure : 'N/A',
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('Fuel Pressure', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 30),

              // Row for RPM / Speed
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Column(
                    children: [
                      Text(
                        _lastRpm,
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('RPM', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                  Column(
                    children: [
                      Text(
                        _lastSpeed != '--' ? '$_lastSpeed MPH' : '-- MPH',
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('Speed', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 30),

              // Row for Coolant / Oil
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Column(
                    children: [
                      Text(
                        _lastCoolantTemp,
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('Coolant Temp', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                  Column(
                    children: [
                      Text(
                        _lastOilTemp,
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('Oil Temp', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 30),

              // Row for Gear / Torque
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Column(
                    children: [
                      Text(
                        _lastGear,
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('Gear', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                  Column(
                    children: [
                      Text(
                        _lastTorque != '--' ? '$_lastTorque lb-ft' : '-- lb-ft',
                        style: const TextStyle(color: Colors.white, fontSize: 40),
                      ),
                      const Text('Torque', style: TextStyle(color: Colors.white)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 40),

              // Connect / Disconnect Button
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                  backgroundColor: bleProvider.status == "Connected" ? Colors.grey : Colors.green,
                ),
                onPressed: bleProvider.status == "Connected"
                    ? () async {
                        bleProvider.addLogMessage("Disconnect button clicked.");
                        await bleProvider.pauseDataRequests();
                        setState(() {
                          _isDataPaused = true;
                        });
                        await bleProvider.disconnect();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Disconnected from device.")),
                        );
                        setState(() {
                          _isDataPaused = false;
                        });
                      }
                    : () async {
                        bleProvider.addLogMessage("Connect button clicked.");
                        await bleProvider.scanAndConnect();
                      },
                child: Text(
                  bleProvider.status == "Connected" ? 'DISCONNECT' : 'CONNECT',
                  style: const TextStyle(fontSize: 16),
                ),
              ),
              const SizedBox(height: 40),

              // Additional "Settings" button at bottom.
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                  backgroundColor: Colors.green,
                ),
                onPressed: () async {
                  if (bleProvider.status == "Connected") {
                    bleProvider.addLogMessage("Settings button clicked from main screen.");
                    await bleProvider.pauseDataRequests();
                    setState(() {
                      _isDataPaused = true;
                    });
                    await Navigator.pushNamed(context, '/settings');
                    await bleProvider.resumeDataRequests();
                    setState(() {
                      _isDataPaused = false;
                    });
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Connect to a device first.")),
                    );
                    bleProvider.addLogMessage("Attempted to open Settings without connection.");
                  }
                },
                child: const Text('SETTINGS', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
