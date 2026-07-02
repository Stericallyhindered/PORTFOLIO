import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'gauge_visibility_provider.dart';
import 'providers/ble_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // Top settings fields.
  String? _selectedPort;
  final TextEditingController _timeoutController =
      TextEditingController(text: '5');
  final TextEditingController _yScaleController =
      TextEditingController(text: '50');

  // Fault Codes (Diagnostics) Section.
  List<String> _faultCodes = [];

  // Diagnostic code map.
  Map<String, String> _diagnosticCodeMap = {};

  // Platform value – if the platform is one of these, diagnostic codes are 6 digits.
  int _platform = 0;

  // Arbitrary command section: text field for entering hex commands.
  final TextEditingController _hexCommandController = TextEditingController();
  String _sendResult = "";

  // List of gauge names.
  final List<String> _gaugeNames = [
    'RPM',
    'Boost',
    'Boost2',
    'TPS',
    'Map Selection',
    'IAT (Intake Temp)',
    'Water Temp',
    'Oil Temp',
    'E85 Content',
    'Trans Temp',
    'Clock',
    'PWM',
    'Fuel Pressure',
    'EGT (Exhaust Temp)',
    'Trim2',
    'Gear',
    'Speed',
    'AFR',
    'Methanol',
    'FFPID',
    'AFR2',
    'DME Boost',
    'Ignition Adv',
    'Avg Ignition',
    'Ign Drop',
    'DME Target',
    'VIN',
    'M1 PID Gain',
    'M1 Throttle',
    'M1 Lag Fix',
    'M1 Boost Limit',
    'Feed Forward',
    '1st Boost Limit',
    '2nd Boost Limit',
    'M1 Meth Hard',
    'Meth Range',
    'Meth Trigger',
    'Fuel Pressure', // second occurrence
    'Firmware Version',
    'N1 Min PSI',
    'N1 Enabled',
    'E85 Bits',
    'N1 Min RPM',
    'N1 Max RPM',
    'N1 Ramp Rate',
    'Virtual FF Offset',
    'Open Loop',
    'Meth Safety',
    'CPS (Crank Sensor)',
    'Acceleration',
    'N1 Min Gear',
    'N1 Min AFR',
    'N1 Min Advance',
    'KR1',
    'KR2',
    'KR3',
    'KR4',
    'KR5',
    'KR6',
    'KR7',
    'KR8',
    'Aux 1',
    'Aux 2',
    'Aux 3',
    'Aux 4',
    'Aux 5',
    'Aux 6',
    'MAF Sensor 1',
    'MAF Sensor 2',
  ];

  // Local diagnostics log for commands/responses from this page.
  final List<String> _diagnosticLog = [];

  // --------------------------------------------------------------------------
  // Diagnostic Functions
  // --------------------------------------------------------------------------
  void _fillDiagnosticCodeMap() {
    _diagnosticCodeMap = {
      "101F01": "Throttle valve opening angle pressure -- Ignore, tuner code",
      "102001": "Air mass, plausibility -- Tuner code, ignore",
      "104401": "MAP sensor, intake pipe, electrical: Short circuit to B+",
      "104402": "MAP sensor short circuit -",
      "105201": "Ambient pressure sensor, value too high",
      "108001": "MAF sensor, electrical: Short circuit to B+",
      "108A01": "MAP sensor, possible loose FlexFuel Wires",
      "108F01": "Boost pressure lower than expected",
      "118401": "Mixture Control AFR too lean",
      "119001": "Rail Sensor short circuit +",
      "119002": "Rail Pressure Sensor Short to Ground",
      "119404": "Rail pressure sensor, signal stuck",
      "119902": "Rail Sensor short circuit",
      "11A002": "Fuel Pressure Below Target",
      "120308": "Boost pressure lower than expected",
      "120408": "Reduced power mode",
      "121001": "TMAP sensor, short circuit to B+",
      "121002": "MAP sensor, short to ground",
      "121102": "TMAP sensor 2 short to ground",
      "122108": "BOV plausibility -- Ignore, tuner code",
      "123004": "Wastegate solenoid disconnected",
      "123102": "Wastegate 2, short to earth",
      "123702": "Wastegate Signal: Short to ground",
      "128010": "O2 Sensor, signal fixed lean",
      "140002": "Misfire Multiple Cylinders",
      "140102": "Misfire Cylinder 1",
      "140202": "Misfire Cylinder 2",
      "152108": "Knocking - Cylinder 1",
      "152D08": "Knocking - Injection system shutdown",
      "180001": "Catless downpipe detected",
      "199102": "Rail Pressure Sensor 2 Short to Ground",
      "1D2008": "Map thermostat, mechanical: jammed open",
      "1D2404": "Map thermostat, line disconnected",
      "1F0525": "Fuel Pressure Below Target",
      "213604": "Battery Discharging More Than Expected",
      // Accelerator pedal module and 30xx codes...
      "30BB": "DME digital motor electronics, internal failure",
      "30BE": "Injector, calibration: plausibility",
      "30C0": "Motor oil pressure control, dynamically",
      "30C1": "Motor oil pressure control, statically",
      "30C2": "Oilpressure-controlvalve, activation",
      "30C3": "Motor oil pressure sensor, signal",
      "30C5": "Oil pump, mechanical: oil pressure",
      "30C6": "Motor oil pressure sensor, plausibility",
      "30C7": "Motor oil pressure system",
      "30C9": "Motor oil pressure pump, controls",
      "30CA": "Diverter valve, controls",
      "30CF": "Wastegate, input signal",
      "30D0": "Wastegate 2, input signal",
      "30D6": "Nitric oxide sensor, plausibility",
      "30D8": "NOX sensor, sensor damaged",
      "30DA": "NOX sensor, heating time",
      "30DC": "Nitric oxide sensor, heating",
      "30DE": "NOX sensor - Lambda probe before catalyst, correlation",
      "30E0": "NOX sensor, offset",
      "30E2": "NOX sensor, thrust test",
      "30E4": "NOX sensor, aging",
      "30E6": "NOX sensor, dynamics",
      "30E9": "NOX sensor catalytic converter, aging",
      "30ED": "Glow ignition: cylinder 1",
      "30EE": "Glow ignition: cylinder 2",
      "30EF": "Glow ignition: cylinder 3",
      "30F0": "Glow ignition: cylinder 4",
      "30F1": "Glow ignition: cylinder 5",
      "30F2": "Glow ignition: cylinder 6",
      "30FC": "Exhaust fume turbo charger, density",
      "30FE": "Boost over target",
      "30FF": "Boost under target -- possible boost leak",
      "3100": "Low boost mode engaged -- CEL displayed",
      "3104": "Uneven running, layer loading process",
      "CD87": "PT-CAN communication error",
      "CD8B": "Local-CAN communication failure",
      "CDB5": "PT-CAN communication failure",
      "2FCA": "Internal Code from new ECU software, ignore",
      "2FDA": "Internal Code from new ECU software, ignore",
      "2A7C": "Internal Code from new ECU software, ignore",
      "2FDB": "Internal Code from new ECU software, ignore",
      "2FC6": "Energy save mode active",
    };
  }

  String _searchCode(String codeFragment) {
    if (_diagnosticCodeMap.containsKey(codeFragment)) {
      return _diagnosticCodeMap[codeFragment]!;
    }
    return "$codeFragment No Description Found";
  }

  Future<void> _readDiagnosticCodes() async {
    final jb4 = Provider.of<JB4BleProvider>(context, listen: false);
    setState(() {
      _diagnosticLog.add("[SEND] G (Read DME Codes)");
    });
    if (jb4.status != "Connected") {
      setState(() {
        _faultCodes = ["Device not connected"];
        _diagnosticLog.add("[ERROR] Device not connected");
      });
      return;
    }
    int tempB = 4;
    List<int> bmwSixDigitPlatforms = [
      1, 2, 3, 7, 8, 10, 11, 12, 19, 41, 46, 48, 58, 63, 64, 65, 68, 24, 640
    ];
    if (bmwSixDigitPlatforms.contains(_platform)) {
      tempB = 6;
    }
    _fillDiagnosticCodeMap();
    setState(() {
      _faultCodes = ["Checking codes..."];
    });
    // Send diagnostic command "G" (0x47) as ASCII.
    await jb4.sendAsciiCommand("G");
    // Wait for the response.
    await Future.delayed(Duration(seconds: 1));
    String lcCodes = jb4.asciiBuffer;
    jb4.clearAsciiBuffer();
    setState(() {
      _diagnosticLog.add("[RECV] $lcCodes");
    });
    if (lcCodes.trim() == ";") {
      setState(() {
        _faultCodes = ["No Codes Found"];
      });
    } else if (lcCodes.trim() == "") {
      setState(() {
        _faultCodes = ["Read Failed"];
      });
    } else {
      String lcOutput = "";
      while (lcCodes.length >= tempB) {
        String codeFragment = lcCodes.substring(0, tempB).trim();
        lcOutput += _searchCode(codeFragment) + "\n";
        lcCodes = lcCodes.substring(tempB);
      }
      setState(() {
        _faultCodes = lcOutput.trim().split("\n");
      });
    }
  }

  Future<void> _deleteDiagnosticCodes() async {
    final jb4 = Provider.of<JB4BleProvider>(context, listen: false);
    setState(() {
      _faultCodes = ["Deleting all codes..."];
      _diagnosticLog.add("[SEND] H (Delete All Codes)");
    });
    await jb4.sendAsciiCommand("H"); // "H" clears codes.
    await Future.delayed(Duration(milliseconds: 1500));
    await _readDiagnosticCodes();
  }

  /// Helper method to convert a list of bytes to a hex string for logging.
  String _bytesToHex(List<int> bytes) {
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ');
  }

  /// Sends an arbitrary hex command.
  /// This method converts the entered hex string (e.g., "2423434A") into a list of
  /// raw byte values (e.g., [0x24, 0x23, 0x43, 0x4A]), sends that byte array,
  /// then waits briefly to capture and display the full reply from the device.
  Future<void> _sendArbitraryCommand() async {
    final jb4 = Provider.of<JB4BleProvider>(context, listen: false);
    String input = _hexCommandController.text.trim();
    if (input.isEmpty) return;
    try {
      String hexStr =
          input.toLowerCase().replaceAll("0x", "").replaceAll(" ", "");
      // Pad with leading zero if odd length.
      if (hexStr.length % 2 != 0) {
        hexStr = "0" + hexStr;
      }
      List<int> bytes = [];
      for (int i = 0; i < hexStr.length; i += 2) {
        String byteStr = hexStr.substring(i, i + 2);
        int byteVal = int.parse(byteStr, radix: 16);
        bytes.add(byteVal);
      }
      setState(() {
        _diagnosticLog.add(
            "[SEND] Arbitrary Hex: $hexStr => ${_bytesToHex(bytes)}");
      });
      bool success = await jb4.sendCommandWithoutResponsePublic(bytes);
      if (success) {
        setState(() {
          _sendResult =
              "Command sent: ${_bytesToHex(bytes)}. Waiting for response...";
          _diagnosticLog.add("[RESULT] $_sendResult");
        });
        // Wait for the device to reply (adjust delay as needed).
        await Future.delayed(const Duration(seconds: 1));
        String reply = jb4.asciiBuffer;
        setState(() {
          _sendResult += "\nReply: ${reply.isEmpty ? "No reply" : reply}";
          _diagnosticLog.add(
              "[RECV] Reply: ${reply.isEmpty ? "No reply" : reply}");
        });
      } else {
        setState(() {
          _sendResult = "Failed to send command";
          _diagnosticLog.add("[RESULT] $_sendResult");
        });
      }
    } catch (e) {
      setState(() {
        _sendResult = "Error: $e";
        _diagnosticLog.add("[ERROR] $_sendResult");
      });
    }
  }

  /// NEW: Preset Commands for testing.
  /// A map of preset command names (with their quoted text and hex representation)
  /// to the corresponding byte array that will be sent.
  final Map<String, List<int>> _presetCommands = {
    r'$#CJ (24 23 43 4A)': [0x24, 0x23, 0x43, 0x4A],
    'BBB (42 42 42)': [0x42, 0x42, 0x42],
    'E (45)': [0x45],
    'Stop Logging (B)': [0x42],
    'Start Logging (CA)': [0x43, 0x41],
    // Add more preset commands as needed from your master command list.
  };

  String? _selectedPresetCommand;
  String _presetReplyLog = "";

  /// Sends the chosen preset command and handles the raw reply.
  Future<void> _sendPresetCommand() async {
    if (_selectedPresetCommand == null) return;
    final jb4 = Provider.of<JB4BleProvider>(context, listen: false);

    // Clear previous reply log.
    setState(() {
      _presetReplyLog = "";
    });

    final bytes = _presetCommands[_selectedPresetCommand]!;
    _diagnosticLog.add("[SEND PRESET] $_selectedPresetCommand => ${_bytesToHex(bytes)}");

    bool success = await jb4.sendCommandWithoutResponsePublic(bytes);
    if (!success) {
      setState(() {
        _presetReplyLog = "Failed to send command.";
      });
      return;
    }

    // Wait briefly for a reply.
    await Future.delayed(const Duration(seconds: 1));
    String rawReply = jb4.asciiBuffer;
    jb4.clearAsciiBuffer();

    setState(() {
      _presetReplyLog = "Raw reply (ASCII):\n$rawReply\n\nRaw reply (hex):\n${_stringToHex(rawReply)}";
    });
    _diagnosticLog.add("[RECV PRESET] $rawReply");

    // If the reply contains an extended 'a' block, parse it.
    _maybeParseABlock(rawReply);
  }

  /// Helper: Convert a string’s code units to hex.
  String _stringToHex(String input) {
    final codes = input.codeUnits;
    return codes.map((c) => c.toRadixString(16).padLeft(2, '0')).join(' ');
  }

  /// Helper: If an 'a' block is found, parse the following 48 bytes into individual settings.
  /// This demo assumes that after the 'a' character, the next 48 characters correspond to the block.
  void _maybeParseABlock(String rawReply) {
    int index = rawReply.indexOf('a');
    if (index < 0) return; // No 'a' block found.
    if (rawReply.length < index + 1 + 48) {
      _diagnosticLog.add("[WARNING] 'a' found, but not enough data for a complete 48-byte block.");
      return;
    }
    String block48 = rawReply.substring(index + 1, index + 1 + 48);
    List<int> blockBytes = block48.codeUnits;

    // Parse first 24 bytes as 12 two-byte pairs (RPM calibrations).
    List<String> parsedRPMs = [];
    for (int i = 0; i < 12; i++) {
      int high = blockBytes[i * 2];
      int low = blockBytes[i * 2 + 1];
      int combined = (high << 8) + low;
      double value = combined / 10.0;
      parsedRPMs.add("RPM ${1500 + i * 500}: [${high.toString()}, ${low.toString()}] → $combined → $value");
    }

    // Example: Parse additional fields.
    int tmapSensor = blockBytes[24];
    int boostLimit3rd = blockBytes[25];
    // Continue parsing according to your C code’s specification.
    // For example, bytes 26..47 would be parsed for fuel biases, six-cylinder timing, etc.

    String blockLog = "=== Parsed 'a' Block ===\n"
        "Full 48 bytes (hex): ${blockBytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ')}\n\n"
        "RPM Calibration Values:\n";
    for (String rpmField in parsedRPMs) {
      blockLog += "$rpmField\n";
    }
    blockLog += "\nTMAP Sensor (byte[24]): $tmapSensor\n"
        "Boost Limit 3rd (byte[25]): $boostLimit3rd\n"
        "... (continue parsing remaining bytes as per specification)\n";

    _diagnosticLog.add(blockLog);
    setState(() {
      _presetReplyLog += "\n\n" + blockLog;
    });
  }

  /// Function to email the diagnostic log using a mailto link.
  Future<void> _emailDiagnosticLog() async {
    final String logBody = _diagnosticLog.join("\n");
    final Uri emailLaunchUri = Uri(
      scheme: 'mailto',
      path: '',
      query:
          'subject=${Uri.encodeComponent("Diagnostic Log")}&body=${Uri.encodeComponent(logBody)}',
    );
    if (await canLaunchUrl(emailLaunchUri)) {
      await launchUrl(emailLaunchUri);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not launch email app')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final gaugeVisibilityProvider =
        Provider.of<GaugeVisibilityProvider>(context);
    final jb4 = Provider.of<JB4BleProvider>(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Settings Section.
            const Text(
              'Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                const Text('Port: '),
                const SizedBox(width: 10),
                DropdownButton<String>(
                  value: _selectedPort,
                  items: <String>[
                    'Select from drop down...',
                    'COM1',
                    'COM2',
                    'COM3'
                  ]
                      .map((e) => DropdownMenuItem<String>(
                            value: e,
                            child: Text(e),
                          ))
                      .toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedPort = val;
                    });
                  },
                ),
              ],
            ),
            Row(
              children: [
                const Text('TimeOut: '),
                const SizedBox(width: 10),
                SizedBox(
                  width: 60,
                  child: TextField(
                    controller: _timeoutController,
                    decoration: const InputDecoration(
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            Row(
              children: [
                const Text('Y Scale: '),
                const SizedBox(width: 10),
                SizedBox(
                  width: 60,
                  child: TextField(
                    controller: _yScaleController,
                    decoration: const InputDecoration(
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Fault Codes Section (Diagnostics)
            const Text(
              'Fault Codes (Diagnostics)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Text(
              'Note: to delete fault codes ignition must be on, engine off. Some newer BMW models... etc.',
            ),
            Row(
              children: [
                ElevatedButton(
                  onPressed: _readDiagnosticCodes,
                  child: const Text('Read DME Codes'),
                ),
                const SizedBox(width: 10),
                ElevatedButton(
                  onPressed: _deleteDiagnosticCodes,
                  child: const Text('Delete All Codes'),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              height: 100,
              width: double.infinity,
              color: Colors.grey[200],
              child: _faultCodes.isEmpty
                  ? const Center(child: Text('No codes'))
                  : ListView.builder(
                      itemCount: _faultCodes.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          title: Text(_faultCodes[index]),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 20),
            // Arbitrary Command Section.
            const Text(
              'Send Arbitrary Hex Command',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _hexCommandController,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: "Enter hex command (e.g., 2423434A)",
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _sendArbitraryCommand,
                  child: const Text("Send"),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              "Result: $_sendResult",
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 20),
            // NEW: Preset Commands Section.
            const Text(
              'Preset Commands (Test Mode)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                Expanded(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: _selectedPresetCommand,
                    hint: const Text('Select a preset command'),
                    items: _presetCommands.keys.map((cmdName) {
                      return DropdownMenuItem<String>(
                        value: cmdName,
                        child: Text(cmdName),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedPresetCommand = val;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _sendPresetCommand,
                  child: const Text("Send Preset"),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.grey[200],
              width: double.infinity,
              height: 150,
              child: SingleChildScrollView(
                child: Text(
                  _presetReplyLog.isEmpty
                      ? "No preset command sent yet."
                      : _presetReplyLog,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Diagnostics Output Section.
            const Text(
              'Diagnostics Output',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Container(
              height: 200,
              width: double.infinity,
              color: Colors.white,
              child: SingleChildScrollView(
                child: Text(
                  _diagnosticLog.join("\n"),
                  style: const TextStyle(fontSize: 12, color: Colors.black),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Legal Disclaimers Section.
            const Text('Never operate a laptop while driving!'),
            const SizedBox(height: 4),
            const Text(
              'Use subject to terms and conditions posted at http://www.burgertuning.com/terms.html',
              style: TextStyle(fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 8),
            const Text(
              'THIS PART IS LEGAL FOR USE ONLY IN COMPETITION RACING VEHICLES...',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 20),
            // Gauge Visibility Section.
            const Text(
              'Gauge Visibility',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _gaugeNames.map((gauge) {
                return FilterChip(
                  label: Text(gauge, style: const TextStyle(fontSize: 12)),
                  selected: Provider.of<GaugeVisibilityProvider>(context)
                          .gaugeVisibility[gauge] ??
                      false,
                  onSelected: (selected) {
                    Provider.of<GaugeVisibilityProvider>(context, listen: false)
                        .setVisibility(gauge, selected);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            // Firmware Update Navigation Section.
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/firmware');
              },
              child: const Text("Firmware Update"),
            ),
            const SizedBox(height: 10),
            // Email Log Section.
            ElevatedButton(
              onPressed: _emailDiagnosticLog,
              child: const Text("Email Log"),
            ),
          ],
        ),
      ),
    );
  }
}
