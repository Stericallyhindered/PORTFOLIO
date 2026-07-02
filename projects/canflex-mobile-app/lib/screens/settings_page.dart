'package:flutter/src/material/
dropdown.dart': Failed 
assertion: line 1002 pos 15:
'items == null ||
items.isEmpty || value == null
||
    items.where((DropdownMenuItem<T> item) {
        return item.value == value;
    }).length == 1':
There should be exactly one 
item with [DropdownButton]'s 
value: 13.
Either zero or 2 or more 
[DropdownMenuItem]s were 
detected with the same value 
See also: https://
docs.flutter.dev/testing/
errors


settings_page.dart


import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../ble_provider.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({Key? key}) : super(key: key);

  @override
  _SettingsPageState createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> with SingleTickerProviderStateMixin {
  // ----------------------------------------------------------------------
  // State variables for settings
  // ----------------------------------------------------------------------
  String selectedCanbusOutput = '0';    // 0..4
  String selectedAnalogOutput = '0';    // 0..2
  String selectedPressureReading = '0'; // 0..4

  int sensorCalibration25 = 25;
  int sensorCalibration50 = 50;
  int sensorCalibration75 = 75;

  String firmwareVersion = 'Unknown';

  // Text controllers for calibration fields
  late TextEditingController _calib25Controller;
  late TextEditingController _calib50Controller;
  late TextEditingController _calib75Controller;

  // For showing spinners / disabling UI
  bool isFetching = false;

  // TabController for "Settings" and "Logs" tabs
  late TabController _tabController;

  @override
  void initState() {
    super.initState();

    // Initialize text controllers
    _calib25Controller = TextEditingController(text: sensorCalibration25.toString());
    _calib50Controller = TextEditingController(text: sensorCalibration50.toString());
    _calib75Controller = TextEditingController(text: sensorCalibration75.toString());

    // Two tabs: "Settings" & "Logs"
    _tabController = TabController(length: 2, vsync: this);

    // Once the widget has built, fetch the device settings
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAllSettings();
    });
  }

  @override
  void dispose() {
    _calib25Controller.dispose();
    _calib50Controller.dispose();
    _calib75Controller.dispose();
    _tabController.dispose();
    super.dispose();
  }

  // Convenient getter
  BleProvider get bleProvider => context.read<BleProvider>();

  // ─────────────────────────────────────────────────────────────────────────
  //  Load Settings
  // ─────────────────────────────────────────────────────────────────────────
  Future<void> _loadAllSettings() async {
    if (bleProvider.status != "Connected") {
      _showErrorSnackbar('Device not connected.');
      bleProvider.addLogMessage("Attempted to load settings without connection.");
      return;
    }

    setState(() => isFetching = true);
    _showLoadingDialog("Loading all device settings...");

    try {
      bool success = await bleProvider.fetchDeviceSettings();
      if (success) {
        // Now read updated fields from bleProvider
        setState(() {
          selectedCanbusOutput   = bleProvider.selectedCanbusOutput;
          selectedAnalogOutput   = bleProvider.selectedAnalogOutput;
          selectedPressureReading= bleProvider.selectedPressureReading;
          firmwareVersion        = bleProvider.firmwareVersion;

          // bleProvider.calibrationValues is a List<int>[25, 50, 75]
          sensorCalibration25    = bleProvider.calibrationValues[0];
          sensorCalibration50    = bleProvider.calibrationValues[1];
          sensorCalibration75    = bleProvider.calibrationValues[2];

          // Update text fields
          _calib25Controller.text= sensorCalibration25.toString();
          _calib50Controller.text= sensorCalibration50.toString();
          _calib75Controller.text= sensorCalibration75.toString();
        });

        bleProvider.addLogMessage("Successfully loaded settings into the UI.");
      } else {
        _showErrorSnackbar("Failed to fetch device settings.");
        bleProvider.addLogMessage("Failed to fetch all device settings.");
      }
    } catch (e) {
      _showErrorSnackbar("Error loading settings: $e");
      bleProvider.addLogMessage("Error loading settings: $e");
    } finally {
      setState(() => isFetching = false);
      _closeLoadingDialog();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Save Settings
  // ─────────────────────────────────────────────────────────────────────────
  Future<void> _saveSettings() async {
    if (bleProvider.status != "Connected") {
      _showErrorSnackbar('Device not connected.');
      bleProvider.addLogMessage("Attempted to save settings without connection.");
      return;
    }

    // Build commands only if something changed
    List<List<int>> commands = [];

    // Compare local state vs. bleProvider
    // If different => add command

    // 1) CANbus
    if (selectedCanbusOutput != bleProvider.selectedCanbusOutput) {
      int canbusVal = int.parse(selectedCanbusOutput);
      commands.add([0x50, canbusVal, 0x0D, 0x0A, 0x00]);
      bleProvider.addLogMessage("Prepared CANbus Output command => $canbusVal");
    }

    // 2) Analog
    if (selectedAnalogOutput != bleProvider.selectedAnalogOutput) {
      int analogVal = int.parse(selectedAnalogOutput);
      commands.add([0x51, analogVal, 0x0D, 0x0A, 0x00]);
      bleProvider.addLogMessage("Prepared Analog Output command => $analogVal");
    }

    // 3) Pressure Reading
    if (selectedPressureReading != bleProvider.selectedPressureReading) {
      int pressureVal = int.parse(selectedPressureReading);
      commands.add([0x53, pressureVal, 0x0D, 0x0A, 0x00]);
      bleProvider.addLogMessage("Prepared Pressure Reading command => $pressureVal");
    }

    // 4) Calibration
    List<int> bleCalib = bleProvider.calibrationValues; // e.g. [25, 50, 75]
    if (sensorCalibration25 != bleCalib[0] ||
        sensorCalibration50 != bleCalib[1] ||
        sensorCalibration75 != bleCalib[2]) {
      commands.add([
        0x52,
        sensorCalibration25,
        sensorCalibration50,
        sensorCalibration75,
        0x0D,
        0x0A,
        0x00
      ]);
      bleProvider.addLogMessage("Prepared Calibration => [$sensorCalibration25, $sensorCalibration50, $sensorCalibration75]");
    }

    if (commands.isEmpty) {
      _showErrorSnackbar('No changes to save.');
      bleProvider.addLogMessage("Save Settings attempted but no fields changed.");
      return;
    }

    setState(() => isFetching = true);
    _showLoadingDialog("Saving settings...");

    try {
      await bleProvider.saveSettings(commands);
      _showSuccessSnackbar('Settings saved successfully!');
      bleProvider.addLogMessage("Settings saved successfully.");

      // Optionally reload everything
      await _loadAllSettings();
    } catch (e) {
      _showErrorSnackbar("Error saving settings: $e");
      bleProvider.addLogMessage("Error saving settings: $e");
    } finally {
      setState(() => isFetching = false);
      _closeLoadingDialog();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Widget Builders
  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final bleProviderState = context.watch<BleProvider>();

    return WillPopScope(
      onWillPop: () async {
        bleProvider.addLogMessage("Exited Settings page via back button.");
        // Attempt to resume data requests
        await bleProvider.resumeDataRequests();
        return true;
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Settings'),
          backgroundColor: Colors.black,
          bottom: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Settings'),
              Tab(text: 'Logs'),
            ],
          ),
        ),
        backgroundColor: Colors.black,
        body: bleProviderState.status == "Connected"
            ? TabBarView(
                controller: _tabController,
                children: [
                  _buildSettingsForm(),
                  _buildLogTab(),
                ],
              )
            : _buildDisconnectedMessage(),
      ),
    );
  }

  Widget _buildDisconnectedMessage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Device not connected',
            style: TextStyle(fontSize: 18, color: Colors.white),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () async {
              bleProvider.addLogMessage("Retry Connection button clicked on Settings Page.");
              // Possibly just try reloading
              await _loadAllSettings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 10),
            ),
            child: const Text('Retry Connection'),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoRow('Firmware Version', firmwareVersion),
          const SizedBox(height: 20),

          // CANbus Output
          _buildDropdown(
            'CANbus Output',
            [
              {'label': 'Disabled', 'value': '0'},
              {'label': 'JB4', 'value': '1'},
              {'label': 'MHD G Chassis', 'value': '2'},
              {'label': 'MHD F Chassis', 'value': '3'},
              {'label': 'BM3', 'value': '4'},
            ],
            selectedCanbusOutput,
            (value) => setState(() {
              selectedCanbusOutput = value!;
              bleProvider.addLogMessage("CANbus Output changed to $selectedCanbusOutput.");
            }),
            isEnabled: !isFetching,
          ),

          const SizedBox(height: 20),

          // Analog Output
          _buildDropdown(
            'Analog Output',
            [
              {'label': 'Disabled', 'value': '0'},
              {'label': '0-5V', 'value': '1'},
              {'label': '0.5-4.5V', 'value': '2'},
            ],
            selectedAnalogOutput,
            (value) => setState(() {
              selectedAnalogOutput = value!;
              bleProvider.addLogMessage("Analog Output changed to $selectedAnalogOutput.");
            }),
            isEnabled: !isFetching,
          ),

          const SizedBox(height: 20),

          // Pressure Reading
          _buildDropdown(
            'Pressure Reading',
            [
              {'label': 'Disabled', 'value': '0'},
              {'label': 'Fuel Pressure 10bar', 'value': '1'},
              {'label': 'Boost 3.5bar', 'value': '2'},
              {'label': 'Boost 4bar', 'value': '3'},
              {'label': 'Boost 5bar', 'value': '4'},
            ],
            selectedPressureReading,
            (value) => setState(() {
              selectedPressureReading = value!;
              bleProvider.addLogMessage("Pressure Reading changed to $selectedPressureReading.");
            }),
            isEnabled: !isFetching,
          ),

          const SizedBox(height: 20),

          // Calibration
          const Text('Sensor Calibration', style: TextStyle(color: Colors.white, fontSize: 16)),
          _buildCalibrationField('25%', _calib25Controller),
          _buildCalibrationField('50%', _calib50Controller),
          _buildCalibrationField('75%', _calib75Controller),
          const SizedBox(height: 30),

          // Save button
          Center(
            child: ElevatedButton(
              onPressed: isFetching ? null : _saveSettings,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
              ),
              child: const Text('Save Settings'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogTab() {
    final allLogs = bleProvider.logs;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Device Log', style: TextStyle(color: Colors.white, fontSize: 16)),
          const SizedBox(height: 10),
          Container(
            color: Colors.grey[800],
            height: 300,
            child: allLogs.isNotEmpty
                ? ListView.builder(
                    itemCount: allLogs.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Text(
                          allLogs[index],
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
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 16)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildDropdown(
    String label,
    List<Map<String, String>> options,
    String selectedValue,
    ValueChanged<String?> onChanged, {
    required bool isEnabled,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 16)),
        DropdownButton<String>(
          value: selectedValue,
          items: options.map((option) {
            return DropdownMenuItem(
              value: option['value'],
              child: Text(option['label']!),
            );
          }).toList(),
          onChanged: isEnabled ? onChanged : null,
          dropdownColor: Colors.grey[900],
          style: const TextStyle(color: Colors.white, fontSize: 16),
          isExpanded: true,
          underline: Container(
            height: 2,
            color: Colors.green,
          ),
        ),
      ],
    );
  }

  Widget _buildCalibrationField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 16)),
          SizedBox(
            width: 100,
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              onChanged: (val) {
                int? parsed = int.tryParse(val);
                setState(() {
                  if (parsed != null && parsed >= 0 && parsed <= 100) {
                    if (label == '25%') {
                      sensorCalibration25 = parsed;
                      bleProvider.addLogMessage("Sensor Calibration 25% set to $parsed.");
                    }
                    if (label == '50%') {
                      sensorCalibration50 = parsed;
                      bleProvider.addLogMessage("Sensor Calibration 50% set to $parsed.");
                    }
                    if (label == '75%') {
                      sensorCalibration75 = parsed;
                      bleProvider.addLogMessage("Sensor Calibration 75% set to $parsed.");
                    }
                  } else {
                    // Revert to previous valid value if input is invalid
                    if (label == '25%') controller.text = sensorCalibration25.toString();
                    if (label == '50%') controller.text = sensorCalibration50.toString();
                    if (label == '75%') controller.text = sensorCalibration75.toString();

                    _showErrorSnackbar('Please enter a value between 0 and 100.');
                    bleProvider.addLogMessage("Invalid input for $label: $val.");
                  }
                });
              },
              decoration: const InputDecoration(
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Loading / Snackbar Helpers
  // ─────────────────────────────────────────────────────────────────────────
  void _showLoadingDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
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

  void _closeLoadingDialog() {
    if (mounted) {
      Navigator.of(context).pop(); // close the most recent dialog
    }
  }

  void _showErrorSnackbar(String message) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message, style: const TextStyle(color: Colors.red)),
        ),
      );
    });
  }

  void _showSuccessSnackbar(String message) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message, style: const TextStyle(color: Colors.green)),
        ),
      );
    });
  }
}

