import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '/providers/ble_provider.dart';

// Helper function to convert int to bytes
List<int> _wordToBytes(int value) {
  return [(value >> 8) & 0xFF, value & 0xFF];
}

class WMIScreen extends StatefulWidget {
  const WMIScreen({Key? key}) : super(key: key);

  @override
  State<WMIScreen> createState() => _WMIScreenState();
}

class _WMIScreenState extends State<WMIScreen> {
  // Controllers for Water/Meth Injection fields.
  final TextEditingController _boostAdditiveController = TextEditingController();
  final TextEditingController _signalScalingController = TextEditingController();
  final TextEditingController _minFlowBoostController = TextEditingController();

  // Controllers for External Output fields.
  final TextEditingController _enabledController = TextEditingController();
  final TextEditingController _minRpmController = TextEditingController();
  final TextEditingController _maxRpmController = TextEditingController();
  final TextEditingController _minTpsController = TextEditingController();
  final TextEditingController _minGearController = TextEditingController();
  final TextEditingController _minAdvanceController = TextEditingController();
  final TextEditingController _minAfrController = TextEditingController();

  final TextEditingController _virtualSensorOffsetController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
      setState(() => _isLoading = true);
      await bleProvider.fetchSettings();
      setState(() => _isLoading = false);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
    setState(() => _isLoading = bleProvider.isLoadingSettings);
    
    if (!bleProvider.isLoadingSettings) {
      // Initialize ethanol setup in provider
      bleProvider.setEthanolSetup(bleProvider.e85Bits & 0x0F); // Lower 4 bits
      bleProvider.setScalePiOnFlexFuel((bleProvider.e85Bits & 0x10) != 0);
      bleProvider.setStartupE85Indicator((bleProvider.e85Bits & 0x20) != 0);
      bleProvider.setBlockedInUSA((bleProvider.e85Bits & 0x40) != 0);
      bleProvider.setEnableWmiPumpPwm((bleProvider.e85Bits & 0x80) != 0);
      
      _populateControllers(bleProvider);
    }
  }
  
  // Separate method to populate controllers for better organization
  void _populateControllers(JB4BleProvider bleProvider) {
    bleProvider.addLog("Populating WMI screen controllers...");

    // Populate Water/Meth Injection fields
    _boostAdditiveController.text = bleProvider.m1MethHard;
    bleProvider.addLog("Boost Additive: ${bleProvider.m1MethHard}");
    
    _signalScalingController.text = bleProvider.methRange;
    bleProvider.addLog("Signal Scaling: ${bleProvider.methRange}");
    
    _minFlowBoostController.text = bleProvider.n1MinPsi;
    bleProvider.addLog("Min Flow Boost: ${bleProvider.n1MinPsi}");

    // Populate External Output fields
    _enabledController.text = bleProvider.n1Enabled;
    bleProvider.addLog("External Output Enabled: ${bleProvider.n1Enabled}");
    
    _minRpmController.text = bleProvider.n1MinRpm;
    bleProvider.addLog("Min RPM: ${bleProvider.n1MinRpm}");
    
    _maxRpmController.text = bleProvider.n1MaxRpm;
    bleProvider.addLog("Max RPM: ${bleProvider.n1MaxRpm}");
    
    _minTpsController.text = bleProvider.methTrigger;
    bleProvider.addLog("Min TPS: ${bleProvider.methTrigger}");
    
    _minGearController.text = bleProvider.n1MinGear;
    bleProvider.addLog("Min Gear: ${bleProvider.n1MinGear}");
    
    _minAdvanceController.text = bleProvider.n1MinAdvance;
    bleProvider.addLog("Min Advance: ${bleProvider.n1MinAdvance}");
    
    _minAfrController.text = bleProvider.n1MinAfr;
    bleProvider.addLog("Min AFR: ${bleProvider.n1MinAfr}");

    // Populate Virtual Sensor Offset
    _virtualSensorOffsetController.text = bleProvider.virtualFfOffset;
    bleProvider.addLog("Virtual Sensor Offset: ${bleProvider.virtualFfOffset}");

    // Log E85 bits state
    bleProvider.addLog("E85 Bits State:");
    bleProvider.addLog("- Ethanol Setup: ${bleProvider.ethanolSetup}");
    bleProvider.addLog("- Scale PI on FlexFuel: ${bleProvider.scalePiOnFlexFuel}");
    bleProvider.addLog("- Startup E85 Indicator: ${bleProvider.startupE85Indicator}");
    bleProvider.addLog("- Blocked in USA: ${bleProvider.blockedInUSA}");
    bleProvider.addLog("- Enable WMI Pump PWM: ${bleProvider.enableWmiPumpPwm}");

    bleProvider.addLog("WMI screen controllers populated successfully");
  }

  @override
  void dispose() {
    _boostAdditiveController.dispose();
    _signalScalingController.dispose();
    _minFlowBoostController.dispose();
    _enabledController.dispose();
    _minRpmController.dispose();
    _maxRpmController.dispose();
    _minTpsController.dispose();
    _minGearController.dispose();
    _minAdvanceController.dispose();
    _minAfrController.dispose();
    _virtualSensorOffsetController.dispose();
    super.dispose();
  }


  @override
  Widget build(BuildContext context) {
    // Determine available screen width to decide layout.
    final screenWidth = MediaQuery.of(context).size.width;
    final bool isWide = screenWidth >= 600; // Threshold for side-by-side layout.

    return Consumer<JB4BleProvider>(
      builder: (context, bleProvider, child) {
        return Stack(
          children: [
            Scaffold(
              appBar: AppBar(
                title: const Text('WMI'),
                actions: [
                  if (_isLoading)
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Center(child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )),
                    ),
                ],
              ),
              body: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: isWide 
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildLeftColumn()),
                          const SizedBox(width: 20),
                          Expanded(child: _buildRightColumn()),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLeftColumn(),
                          const SizedBox(height: 20),
                          _buildRightColumn(),
                        ],
                      ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildLeftColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Water/Meth Injection',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        _labeledField('Boost Additive (0-75)', _boostAdditiveController),
        _labeledField('Signal Scaling (0-100)', _signalScalingController),
        _labeledField('Min Flow Boost (PSI)', _minFlowBoostController),
        const SizedBox(height: 20),
        const Text(
          'External Output',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        _labeledField('Enabled', _enabledController),
        _labeledField('Min RPM', _minRpmController),
        _labeledField('Max RPM', _maxRpmController),
        _labeledField('Min TPS', _minTpsController),
        _labeledField('Min Gear', _minGearController),
        _labeledField('Min Advance', _minAdvanceController),
        _labeledField('Min AFR', _minAfrController),
        const SizedBox(height: 16),
        Center(
          child: ElevatedButton(
            onPressed: () async {
              final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
              
              // Show saving dialog
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (BuildContext context) {
                  return const AlertDialog(
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 20),
                        Text("Saving WMI settings..."),
                      ],
                    ),
                  );
                },
              );

                try {
                  bleProvider.addLog("Building WMI settings packet (26 bytes)...");
                  
                  // Build 26-byte packet starting with 'T' (84)
                  List<int> packet = List<int>.filled(26, 0);
                  packet[0] = 84; // ASCII 'T'
                  bleProvider.addLog("Byte 0: 0x54 (Command 'T')");
                  
                  // Convert min flow boost (bytes 1-2)
                  double minFlow = double.tryParse(_minFlowBoostController.text) ?? 0.0;
                  int minFlowInt = (minFlow * 10).round();
                  List<int> minFlowBytes = _wordToBytes(minFlowInt);
                  packet[1] = minFlowBytes[0];
                  packet[2] = minFlowBytes[1];
                  bleProvider.addLog("Bytes 1-2 (Min Flow Boost): $minFlow PSI -> Raw $minFlowInt -> [0x${minFlowBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${minFlowBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // External Output settings (bytes 3-4)
                  int enabled = int.tryParse(_enabledController.text) ?? 0;
                  List<int> enabledBytes = _wordToBytes(enabled);
                  packet[3] = enabledBytes[0];
                  packet[4] = enabledBytes[1];
                  bleProvider.addLog("Bytes 3-4 (External Output): Value $enabled -> [0x${enabledBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${enabledBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Ethanol setup bits from provider (bytes 5-6)
                  int ethanolBits = bleProvider.ethanolSetup & 0x0F; // Lower 4 bits
                  if (bleProvider.scalePiOnFlexFuel) ethanolBits |= 0x10;
                  if (bleProvider.startupE85Indicator) ethanolBits |= 0x20;
                  if (bleProvider.blockedInUSA) ethanolBits |= 0x40;
                  if (bleProvider.enableWmiPumpPwm) ethanolBits |= 0x80;
                  List<int> ethanolBytes = _wordToBytes(ethanolBits);
                  packet[5] = ethanolBytes[0];
                  packet[6] = ethanolBytes[1];

                  StringBuffer bitsLog = StringBuffer();
                  bitsLog.write("Bytes 5-6 (Ethanol Setup): 0x${ethanolBits.toRadixString(16).padLeft(2, '0')} [");
                  bitsLog.write(bleProvider.ethanolSetup > 0 ? "FlexFuel Input ${bleProvider.ethanolSetup}, " : "");
                  bitsLog.write(bleProvider.scalePiOnFlexFuel ? "Scale PI, " : "");
                  bitsLog.write(bleProvider.startupE85Indicator ? "E85 Indicator, " : "");
                  bitsLog.write(bleProvider.blockedInUSA ? "Blocked USA, " : "");
                  bitsLog.write(bleProvider.enableWmiPumpPwm ? "WMI Pump PWM" : "");
                  bitsLog.write("] -> [0x${ethanolBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${ethanolBytes[1].toRadixString(16).padLeft(2, '0')}]");
                  bleProvider.addLog(bitsLog.toString());

                  // Min RPM (bytes 7-8)
                  int minRpm = int.tryParse(_minRpmController.text) ?? 0;
                  List<int> minRpmBytes = _wordToBytes(minRpm);
                  packet[7] = minRpmBytes[0];
                  packet[8] = minRpmBytes[1];
                  bleProvider.addLog("Bytes 7-8 (Min RPM): $minRpm RPM -> [0x${minRpmBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${minRpmBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Max RPM (bytes 9-10)
                  int maxRpm = int.tryParse(_maxRpmController.text) ?? 0;
                  List<int> maxRpmBytes = _wordToBytes(maxRpm);
                  packet[9] = maxRpmBytes[0];
                  packet[10] = maxRpmBytes[1];
                  bleProvider.addLog("Bytes 9-10 (Max RPM): $maxRpm RPM -> [0x${maxRpmBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${maxRpmBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Ramp Rate (bytes 11-12)
                  int rampRate = 1; // Default value
                  List<int> rampRateBytes = _wordToBytes(rampRate);
                  packet[11] = rampRateBytes[0];
                  packet[12] = rampRateBytes[1];
                  bleProvider.addLog("Bytes 11-12 (Ramp Rate): $rampRate -> [0x${rampRateBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${rampRateBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Virtual sensor offset (bytes 13-14)
                  int vOffset = int.tryParse(_virtualSensorOffsetController.text) ?? 0;
                  List<int> vOffsetBytes = _wordToBytes(vOffset);
                  packet[13] = vOffsetBytes[0];
                  packet[14] = vOffsetBytes[1];
                  bleProvider.addLog("Bytes 13-14 (Virtual Sensor Offset): Value $vOffset -> [0x${vOffsetBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${vOffsetBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Boost Additive (bytes 15-16)
                  int boostAdd = int.tryParse(_boostAdditiveController.text) ?? 0;
                  List<int> boostBytes = _wordToBytes(boostAdd);
                  packet[15] = boostBytes[0];
                  packet[16] = boostBytes[1];
                  bleProvider.addLog("Bytes 15-16 (Boost Additive): Value $boostAdd -> [0x${boostBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${boostBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Signal Scaling (bytes 17-18)
                  int signalScale = int.tryParse(_signalScalingController.text) ?? 0;
                  List<int> scaleBytes = _wordToBytes(signalScale);
                  packet[17] = scaleBytes[0];
                  packet[18] = scaleBytes[1];
                  bleProvider.addLog("Bytes 17-18 (Signal Scaling): Value $signalScale% -> [0x${scaleBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${scaleBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Min Gear (bytes 19-20)
                  int minGear = int.tryParse(_minGearController.text) ?? 0;
                  List<int> minGearBytes = _wordToBytes(minGear);
                  packet[19] = minGearBytes[0];
                  packet[20] = minGearBytes[1];
                  bleProvider.addLog("Bytes 19-20 (Min Gear): Value $minGear -> [0x${minGearBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${minGearBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Min AFR (bytes 21-22)
                  double minAfr = double.tryParse(_minAfrController.text) ?? 0.0;
                  int minAfrInt = (minAfr * 10).round();
                  List<int> minAfrBytes = _wordToBytes(minAfrInt);
                  packet[21] = minAfrBytes[0];
                  packet[22] = minAfrBytes[1];
                  bleProvider.addLog("Bytes 21-22 (Min AFR): $minAfr -> Raw $minAfrInt -> [0x${minAfrBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${minAfrBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // Min Advance (bytes 23-24)
                  double minAdv = double.tryParse(_minAdvanceController.text) ?? 0.0;
                  int minAdvInt = (minAdv * 10).round();
                  List<int> minAdvBytes = _wordToBytes(minAdvInt);
                  packet[23] = minAdvBytes[0];
                  packet[24] = minAdvBytes[1];
                  bleProvider.addLog("Bytes 23-24 (Min Advance): $minAdv° -> Raw $minAdvInt -> [0x${minAdvBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${minAdvBytes[1].toRadixString(16).padLeft(2, '0')}]");

                  // End marker
                  packet[25] = 36; // ASCII '$'
                  bleProvider.addLog("Byte 25: 0x24 (End Marker '\$')");

                  // Log complete packet
                  bleProvider.addLog("Complete WMI packet: ${packet.map((b) => '0x${b.toRadixString(16).padLeft(2, '0')}').join(' ')}");

                  // 1. Prepare for settings save (stop logging, clear buffer)
                  await bleProvider.prepareForSettingsSave();
                  
                  // 2. Send settings byte-by-byte with delays
                  bleProvider.addLog("Sending WMI settings packet byte-by-byte...");
                  for (int i = 0; i < packet.length; i++) {
                    await bleProvider.sendSingleByte(packet[i]);
                    await Future.delayed(const Duration(milliseconds: 25));
                  }
                  
                  // 3. Wait for processing - longer delay to ensure device processes the packet
                  await Future.delayed(const Duration(milliseconds: 800));
                  
                  // 4. Send E85 bits packet if needed
                  // This ensures the E85 bits are properly saved
                  bleProvider.addLog("Sending E85 bits settings...");
                  int ethanolBits = bleProvider.ethanolSetup & 0x0F; // Lower 4 bits
                  if (bleProvider.scalePiOnFlexFuel) ethanolBits |= 0x10;
                  if (bleProvider.startupE85Indicator) ethanolBits |= 0x20;
                  if (bleProvider.blockedInUSA) ethanolBits |= 0x40;
                  if (bleProvider.enableWmiPumpPwm) ethanolBits |= 0x80;
                  
                  // Send 'R' command with E85 bits
                  String e85Command = "R" + ethanolBits.toString();
                  await bleProvider.sendAsciiCommand(e85Command);
                  await Future.delayed(const Duration(milliseconds: 500));
                  
                  // 4.5 Send Min TPS (methTrigger) separately
                  // This is sent with the 'm' identifier but not part of the WMI settings packet
                  bleProvider.addLog("Sending Min TPS (methTrigger) setting...");
                  int minTps = int.tryParse(_minTpsController.text) ?? 0;
                  String methTriggerCommand = "m" + minTps.toString();
                  await bleProvider.sendAsciiCommand(methTriggerCommand);
                  await Future.delayed(const Duration(milliseconds: 500));
                  
                  // 5. Request data update to verify written
                  bleProvider.clearAsciiBuffer();
                  await Future.delayed(const Duration(milliseconds: 200));
                  
                  await bleProvider.sendAsciiCommand("\$");
                  await Future.delayed(const Duration(milliseconds: 50));
                  await bleProvider.sendAsciiCommand("#");
                  await Future.delayed(const Duration(milliseconds: 50));
                  await bleProvider.sendAsciiCommand("C");
                  await Future.delayed(const Duration(milliseconds: 50));
                  await bleProvider.sendAsciiCommand("J");
                  bleProvider.addLog("Sent \$#CJ command to verify settings");
                  
                  await Future.delayed(const Duration(milliseconds: 800));
                  
                  // 6. Resume logging
                  await bleProvider.sendAsciiCommand("A");
                  
                  bleProvider.addLog("WMI settings save completed");
                  bool success = true;

                // Close saving dialog
                Navigator.of(context).pop();

                // Show result dialog
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return AlertDialog(
                      title: Text(
                        success ? "Success" : "Error",
                        style: TextStyle(
                          color: success ? Colors.green : Colors.red,
                        ),
                      ),
                      content: Text(
                        success ? "WMI settings saved successfully" : "Failed to save WMI settings",
                      ),
                      actions: [
                        TextButton(
                          child: const Text("OK"),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    );
                  },
                );
              } catch (e) {
                bleProvider.addLog("Error saving WMI settings: $e");
                Navigator.of(context).pop(); // Close saving dialog
                
                // Show error dialog
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return AlertDialog(
                      title: const Text("Error", style: TextStyle(color: Colors.red)),
                      content: Text("Failed to save WMI settings: $e"),
                      actions: [
                        TextButton(
                          child: const Text("OK"),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    );
                  },
                );
              }
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Text('Save', style: TextStyle(fontSize: 18)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRightColumn() {
    return Consumer<JB4BleProvider>(
      builder: (context, bleProvider, child) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ethanol Setup',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            _radioRow(0, '0: JB4 2/3/4 FlexFuel Input', bleProvider),
            _radioRow(1, '1: JB4 15/16 FlexFuel Input', bleProvider),
            _radioRow(2, '2: DTML FlexFuel Input', bleProvider),
            _radioRow(3, '3: DTML WMI Input', bleProvider),
            const SizedBox(height: 8),
            _checkRow('4: Scale PI On FlexFuel', bleProvider.scalePiOnFlexFuel, 
              bleProvider.setScalePiOnFlexFuel, bleProvider),
            _checkRow('5: Startup E85 Indicator', bleProvider.startupE85Indicator,
              bleProvider.setStartupE85Indicator, bleProvider),
            _checkRow('Blocked in USA', bleProvider.blockedInUSA,
              bleProvider.setBlockedInUSA, bleProvider),
            _checkRow('7: Enable WMI Pump PWM', bleProvider.enableWmiPumpPwm,
              bleProvider.setEnableWmiPumpPwm, bleProvider),
            const SizedBox(height: 20),
            _labeledField('Virtual Sensor Offset', _virtualSensorOffsetController),
          ],
        );
      }
    );
  }

  /// A labeled text field that adapts for mobile screens.
  Widget _labeledField(String label, TextEditingController ctrl) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          // Use ConstrainedBox to allow the label to have a minimum and maximum width.
          ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 120, maxWidth: 160),
            child: Text(
              label,
              style: const TextStyle(fontSize: 16),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: SizedBox(
              height: 50,
              child: TextField(
                controller: ctrl,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// A radio button row for ethanol setup.
  Widget _radioRow(int val, String label, JB4BleProvider bleProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Radio<int>(
            value: val,
            groupValue: bleProvider.ethanolSetup,
            onChanged: (newVal) {
              bleProvider.setEthanolSetup(newVal ?? 0);
            },
          ),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 16))),
        ],
      ),
    );
  }

  /// A checkbox row for ethanol setup options.
  Widget _checkRow(String label, bool currentVal, ValueChanged<bool> onChanged, JB4BleProvider bleProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Checkbox(
            value: currentVal,
            onChanged: (val) {
              if (val != null) {
                onChanged(val);
              }
            },
          ),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 16))),
        ],
      ),
    );
  }
}
