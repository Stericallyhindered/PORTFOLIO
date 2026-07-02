import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '/providers/ble_provider.dart';
import 'logging_screen.dart';

class UserAdjustmentScreen extends StatefulWidget {
  const UserAdjustmentScreen({Key? key}) : super(key: key);

  @override
  State<UserAdjustmentScreen> createState() => _UserAdjustmentScreenState();
}

class _UserAdjustmentScreenState extends State<UserAdjustmentScreen> {
  bool _isSaving = false;

  // Local controllers for UI only.
  final Map<String, TextEditingController> controllers = {
    // RPM Table: Boost fields
    '1500_boost': TextEditingController(),
    '2000_boost': TextEditingController(),
    '2500_boost': TextEditingController(),
    '3000_boost': TextEditingController(),
    '3500_boost': TextEditingController(),
    '4000_boost': TextEditingController(),
    '4500_boost': TextEditingController(),
    '5000_boost': TextEditingController(),
    '5500_boost': TextEditingController(),
    '6000_boost': TextEditingController(),
    '6500_boost': TextEditingController(),
    '7000_boost': TextEditingController(),

    // RPM Table: Fuel Bias fields
    '1500_fuelBias': TextEditingController(),
    '2000_fuelBias': TextEditingController(),
    '2500_fuelBias': TextEditingController(),
    '3000_fuelBias': TextEditingController(),
    '3500_fuelBias': TextEditingController(),
    '4000_fuelBias': TextEditingController(),
    '4500_fuelBias': TextEditingController(),
    '5000_fuelBias': TextEditingController(),
    '5500_fuelBias': TextEditingController(),
    '6000_fuelBias': TextEditingController(),
    '6500_fuelBias': TextEditingController(),
    '7000_fuelBias': TextEditingController(),

    // RPM Table: Duty Bias fields
    '1500_dutyBias': TextEditingController(),
    '2000_dutyBias': TextEditingController(),
    '2500_dutyBias': TextEditingController(),
    '3000_dutyBias': TextEditingController(),
    '3500_dutyBias': TextEditingController(),
    '4000_dutyBias': TextEditingController(),
    '4500_dutyBias': TextEditingController(),
    '5000_dutyBias': TextEditingController(),
    '5500_dutyBias': TextEditingController(),
    '6000_dutyBias': TextEditingController(),
    '6500_dutyBias': TextEditingController(),
    '7000_dutyBias': TextEditingController(),

    // Advanced Settings
    'm1BoostLimit': TextEditingController(),
    'feedForward': TextEditingController(),
    'm1PidGain': TextEditingController(),
    'm1Throttle': TextEditingController(),
    'methTrigger': TextEditingController(),
    'boostLimit1st': TextEditingController(),
    'boostLimit2nd': TextEditingController(),
    'boostLimit3rd': TextEditingController(),
    'openLoop': TextEditingController(),
    'methSafety': TextEditingController(),
    'm1LagFix': TextEditingController(),

    // WMI Settings
    'n1MinPsi': TextEditingController(),
    'n1Enabled': TextEditingController(),
    'n1MinRpm': TextEditingController(),
    'n1MaxRpm': TextEditingController(),
    'n1RampRate': TextEditingController(),
    'virtualFfOffset': TextEditingController(),
    'm1MethHard': TextEditingController(),
    'methRange': TextEditingController(),
    'n1MinGear': TextEditingController(),
    'n1MinAfr': TextEditingController(),
    'n1MinAdvance': TextEditingController(),

    // Read-only Information
    'tmapVoltage': TextEditingController(),
    'firmwareVer': TextEditingController(),
    'interfaceVer': TextEditingController(),
    'jb4Address': TextEditingController(),
    'vin': TextEditingController(),
    'country': TextEditingController(),
    'learnedIgn': TextEditingController(),
    'lastSafety': TextEditingController(),
    'futureUseA': TextEditingController(),
    'tmap35bar': TextEditingController(),
    'sixCylTimingLogging': TextEditingController(),
  };

  bool _populated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
      bleProvider.fetchSettings();
    });
  }

  @override
  void dispose() {
    for (var controller in controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _populateControllers(JB4BleProvider provider) {
    provider.addLog("Populating User Adjustment Screen controllers...");
    
    // RPM Table: Boost values - Convert from raw values to user-friendly PSI
    controllers['1500_boost']!.text = (double.parse(provider.rpm1500) / 10.0).toStringAsFixed(1);
    controllers['2000_boost']!.text = (double.parse(provider.rpm2000) / 10.0).toStringAsFixed(1);
    controllers['2500_boost']!.text = (double.parse(provider.rpm2500) / 10.0).toStringAsFixed(1);
    controllers['3000_boost']!.text = (double.parse(provider.rpm3000) / 10.0).toStringAsFixed(1);
    controllers['3500_boost']!.text = (double.parse(provider.rpm3500) / 10.0).toStringAsFixed(1);
    controllers['4000_boost']!.text = (double.parse(provider.rpm4000) / 10.0).toStringAsFixed(1);
    controllers['4500_boost']!.text = (double.parse(provider.rpm4500) / 10.0).toStringAsFixed(1);
    controllers['5000_boost']!.text = (double.parse(provider.rpm5000) / 10.0).toStringAsFixed(1);
    controllers['5500_boost']!.text = (double.parse(provider.rpm5500) / 10.0).toStringAsFixed(1);
    controllers['6000_boost']!.text = (double.parse(provider.rpm6000) / 10.0).toStringAsFixed(1);
    controllers['6500_boost']!.text = (double.parse(provider.rpm6500) / 10.0).toStringAsFixed(1);
    controllers['7000_boost']!.text = (double.parse(provider.rpm7000) / 10.0).toStringAsFixed(1);

    // RPM Table: Fuel Bias values
    controllers['1500_fuelBias']!.text = "na";
    controllers['2000_fuelBias']!.text = "na";
    controllers['2500_fuelBias']!.text = "na";
    controllers['3000_fuelBias']!.text = provider.fuel2500;
    controllers['3500_fuelBias']!.text = provider.fuel3000;
    controllers['4000_fuelBias']!.text = provider.fuel3500;
    controllers['4500_fuelBias']!.text = provider.fuel4000;
    controllers['5000_fuelBias']!.text = provider.fuel4500;
    controllers['5500_fuelBias']!.text = provider.fuel5000;
    controllers['6000_fuelBias']!.text = provider.fuel5500;
    controllers['6500_fuelBias']!.text = provider.fuel6000;
    controllers['7000_fuelBias']!.text = provider.fuel6500;

    // RPM Table: Duty Bias values (CPS)
    controllers['1500_dutyBias']!.text = provider.cps1500;
    controllers['2000_dutyBias']!.text = provider.cps2000;
    controllers['2500_dutyBias']!.text = provider.cps2500;
    controllers['3000_dutyBias']!.text = provider.cps3000;
    controllers['3500_dutyBias']!.text = provider.cps3500;
    controllers['4000_dutyBias']!.text = provider.cps4000;
    controllers['4500_dutyBias']!.text = provider.cps4500;
    controllers['5000_dutyBias']!.text = provider.cps5000;
    controllers['5500_dutyBias']!.text = provider.cps5500;
    controllers['6000_dutyBias']!.text = provider.cps6000;
    controllers['6500_dutyBias']!.text = provider.cps6500;
    controllers['7000_dutyBias']!.text = provider.cps7000; 

    // Advanced Settings with default values
    controllers['m1BoostLimit']!.text = provider.m1BoostLimit.isEmpty ? "34" : provider.m1BoostLimit;
    controllers['feedForward']!.text = provider.feedForward.isEmpty ? "35" : provider.feedForward;
    controllers['m1PidGain']!.text = provider.m1PidGain.isEmpty ? "36" : provider.m1PidGain;
    controllers['m1Throttle']!.text = provider.m1Throttle.isEmpty ? "37" : provider.m1Throttle;
    controllers['methTrigger']!.text = provider.methTrigger.isEmpty ? "41" : provider.methTrigger;
    controllers['boostLimit1st']!.text = provider.boostLimit1st.isEmpty ? "42" : provider.boostLimit1st;
    controllers['boostLimit2nd']!.text = provider.boostLimit2nd.isEmpty ? "43" : provider.boostLimit2nd;
    controllers['boostLimit3rd']!.text = provider.boostLimit3rd.isEmpty ? "44" : provider.boostLimit3rd;
    controllers['openLoop']!.text = provider.openLoop.isEmpty ? "39" : provider.openLoop;
    controllers['methSafety']!.text = provider.methSafety.isEmpty ? "40" : provider.methSafety;
    controllers['m1LagFix']!.text = provider.m1LagFix.isEmpty ? "0" : provider.m1LagFix;

    // WMI Settings
    controllers['n1MinPsi']!.text = provider.n1MinPsi;
    controllers['n1Enabled']!.text = provider.n1Enabled;
    controllers['n1MinRpm']!.text = provider.n1MinRpm;
    controllers['n1MaxRpm']!.text = provider.n1MaxRpm;
    controllers['n1RampRate']!.text = provider.n1RampRate;
    controllers['virtualFfOffset']!.text = provider.virtualFfOffset;
    controllers['m1MethHard']!.text = provider.m1MethHard;
    controllers['methRange']!.text = provider.methRange;
    controllers['n1MinGear']!.text = provider.n1MinGear;
    controllers['n1MinAfr']!.text = provider.n1MinAfr;
    controllers['n1MinAdvance']!.text = provider.n1MinAdvance;

    // Read-only Information
    controllers['tmapVoltage']!.text = provider.ambientVoltage;
    controllers['firmwareVer']!.text = provider.jb4Firmware;
    controllers['interfaceVer']!.text = provider.interfaceVer;
    controllers['jb4Address']!.text = provider.status;
    controllers['vin']!.text = provider.vin;
    controllers['country']!.text = provider.country;
    controllers['learnedIgn']!.text = provider.learnedIgn;
    controllers['lastSafety']!.text = provider.lastSafety;
    controllers['futureUseA']!.text = provider.futureUseA;
    controllers['tmap35bar']!.text = provider.tmapSensor;
    controllers['sixCylTimingLogging']!.text = provider.sixCylTiming;
    
    provider.addLog("User Adjustment Screen controllers populated successfully");
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
    if (!bleProvider.isLoadingSettings) {
      // Initialize ethanol setup in provider
      bleProvider.setEthanolSetup(bleProvider.e85Bits & 0x0F);
      bleProvider.setScalePiOnFlexFuel((bleProvider.e85Bits & 0x10) != 0);
      bleProvider.setStartupE85Indicator((bleProvider.e85Bits & 0x20) != 0);
      bleProvider.setBlockedInUSA((bleProvider.e85Bits & 0x40) != 0);
      bleProvider.setEnableWmiPumpPwm((bleProvider.e85Bits & 0x80) != 0);
      
      bleProvider.addLog("E85 Bits State in User Adjustment Screen:");
      bleProvider.addLog("- Ethanol Setup: ${bleProvider.ethanolSetup}");
      bleProvider.addLog("- Scale PI on FlexFuel: ${bleProvider.scalePiOnFlexFuel}");
      bleProvider.addLog("- Startup E85 Indicator: ${bleProvider.startupE85Indicator}");
      bleProvider.addLog("- Blocked in USA: ${bleProvider.blockedInUSA}");
      bleProvider.addLog("- Enable WMI Pump PWM: ${bleProvider.enableWmiPumpPwm}");
    }
  }

  bool _map1Valid() {
    final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
    double tempMAX;
    String tmapSensorValue = controllers['tmap35bar']!.text;
    if (tmapSensorValue == "1") {
      tempMAX = 36.1;
      bleProvider.addLog("TMAP sensor type 1 (3.5 bar): max boost limit set to $tempMAX PSI");
    } else if (tmapSensorValue == "2") {
      tempMAX = 43.0;
      bleProvider.addLog("TMAP sensor type 2 (4.0 bar): max boost limit set to $tempMAX PSI");
    } else {
      tempMAX = 25.0;
      bleProvider.addLog("TMAP sensor type unknown: max boost limit set to $tempMAX PSI");
    }
    tempMAX = 60.0;
    bleProvider.addLog("Global override applied: max boost limit set to $tempMAX PSI");

    try {
      for (int rpm = 1500; rpm <= 7000; rpm += 500) {
        double tempd = double.tryParse(controllers['${rpm}_dutyBias']!.text) ?? 0.0;
        if (tempd < 0 || tempd > 100) {
          showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text("Validation Error"),
                content: const Text("Valid CPS range is 0-100"),
                actions: [
                  TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
                ],
              );
            },
          );
          bleProvider.addLog("MAP1 validation failed: CPS value $tempd out of range at ${rpm}rpm");
          return false;
        }
      }
      for (int rpm = 3000; rpm <= 7000; rpm += 500) {
        if (controllers['${rpm}_fuelBias']!.text == "na") continue;
        double tempd = double.tryParse(controllers['${rpm}_fuelBias']!.text) ?? 0.0;
        if (tempd < 0 || tempd > 200) {
          showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text("Validation Error"),
                content: const Text("Valid fuel range is 0-200"),
                actions: [
                  TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
                ],
              );
            },
          );
          bleProvider.addLog("MAP1 validation failed: Fuel value $tempd out of range at ${rpm}rpm");
          return false;
        }
      }
      for (int rpm = 1500; rpm <= 7000; rpm += 500) {
        double tempd = double.tryParse(controllers['${rpm}_boost']!.text) ?? 0.0;
        if (tempd < 0 || tempd > tempMAX) {
          showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text("Validation Error"),
                content: Text("Valid ${rpm}rpm target is 0-$tempMAX"),
                actions: [
                  TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
                ],
              );
            },
          );
          bleProvider.addLog("MAP1 validation failed: Boost value $tempd out of range at ${rpm}rpm");
          return false;
        }
      }
      final Map<String, List<dynamic>> advancedSettings = {
        'methTrigger': [0, 100, "Valid range is 0-100"],
        'm1LagFix': [0, 100, "Valid range is 0-100"],
        'm1BoostLimit': [0, tempMAX.toInt(), "Valid boost safety failsafe is 0-$tempMAX"],
        'feedForward': [0, 150, "Valid ffmax range is 0-150"],
        'openLoop': [0, 150, "Valid open loop fuel setting is 0-150"],
        'methSafety': [0, 100, "Valid range is 0-100"],
        'm1Throttle': [0, 255, "Valid range is 0-255"],
        'm1PidGain': [0, 255, "Valid pidgain range is 0-255"],
        'boostLimit1st': [0, 255, "Valid boost limit 1st range is 0-255"],
        'boostLimit2nd': [0, 255, "Valid boost limit 2nd range is 0-255"],
        'boostLimit3rd': [0, 255, "Valid boost limit 3rd range is 0-255"],
      };

      for (var setting in advancedSettings.entries) {
        String value = controllers[setting.key]!.text;
        if (value.isEmpty) {
          showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text("Validation Error"),
                content: Text("${setting.key} cannot be empty"),
                actions: [
                  TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
                ],
              );
            },
          );
          bleProvider.addLog("MAP1 validation failed: ${setting.key} is empty");
          return false;
        }
        int numValue = int.tryParse(value) ?? 0;
        if (numValue < setting.value[0] || numValue > setting.value[1]) {
          showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text("Validation Error"),
                content: Text(setting.value[2]),
                actions: [
                  TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
                ],
              );
            },
          );
          bleProvider.addLog("MAP1 validation failed: ${setting.key} value $value out of range");
          return false;
        }
      }
      bleProvider.addLog("MAP1 validation passed");
      return true;
    } catch (e) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text("Validation Error"),
            content: Text("Invalid Value -- Exception: $e"),
            actions: [
              TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
            ],
          );
        },
      );
      bleProvider.addLog("MAP1 validation failed with exception: $e");
      return false;
    }
  }

  List<int> _getSettingsPacket() {
    if (!_map1Valid()) {
      return [];
    }
    final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
    List<int> packet = List<int>.filled(64, 0);
    bleProvider.addLog("Building MAP1 settings packet (64 bytes)");
    packet[0] = 82; // ASCII 'R'
    
    // Handle each RPM value individually like Form1.cs
    // Convert user-friendly PSI values back to raw values for device
    double rpm1500Value = double.tryParse(controllers['1500_boost']!.text) ?? 0.0;
    int rpm1500Raw = (rpm1500Value * 10.0).round();
    List<int> bytes1500 = _wordToBytes(rpm1500Raw);
    packet[1] = bytes1500[0];
    packet[2] = bytes1500[1];
    bleProvider.addLog("RPM 1500: $rpm1500Value PSI -> raw: $rpm1500Raw -> bytes: ${bytes1500[0]},${bytes1500[1]}");

    double rpm2000Value = double.tryParse(controllers['2000_boost']!.text) ?? 0.0;
    int rpm2000Raw = (rpm2000Value * 10.0).round();
    List<int> bytes2000 = _wordToBytes(rpm2000Raw);
    packet[3] = bytes2000[0];
    packet[4] = bytes2000[1];
    bleProvider.addLog("RPM 2000: $rpm2000Value PSI -> raw: $rpm2000Raw -> bytes: ${bytes2000[0]},${bytes2000[1]}");

    double rpm2500Value = double.tryParse(controllers['2500_boost']!.text) ?? 0.0;
    int rpm2500Raw = (rpm2500Value * 10.0).round();
    List<int> bytes2500 = _wordToBytes(rpm2500Raw);
    packet[5] = bytes2500[0];
    packet[6] = bytes2500[1];
    bleProvider.addLog("RPM 2500: $rpm2500Value PSI -> raw: $rpm2500Raw -> bytes: ${bytes2500[0]},${bytes2500[1]}");

    double rpm3000Value = double.tryParse(controllers['3000_boost']!.text) ?? 0.0;
    int rpm3000Raw = (rpm3000Value * 10.0).round();
    List<int> bytes3000 = _wordToBytes(rpm3000Raw);
    packet[7] = bytes3000[0];
    packet[8] = bytes3000[1];
    bleProvider.addLog("RPM 3000: $rpm3000Value PSI -> raw: $rpm3000Raw -> bytes: ${bytes3000[0]},${bytes3000[1]}");

    double rpm3500Value = double.tryParse(controllers['3500_boost']!.text) ?? 0.0;
    int rpm3500Raw = (rpm3500Value * 10.0).round();
    List<int> bytes3500 = _wordToBytes(rpm3500Raw);
    packet[9] = bytes3500[0];
    packet[10] = bytes3500[1];
    bleProvider.addLog("RPM 3500: $rpm3500Value PSI -> raw: $rpm3500Raw -> bytes: ${bytes3500[0]},${bytes3500[1]}");

    double rpm4000Value = double.tryParse(controllers['4000_boost']!.text) ?? 0.0;
    int rpm4000Raw = (rpm4000Value * 10.0).round();
    List<int> bytes4000 = _wordToBytes(rpm4000Raw);
    packet[11] = bytes4000[0];
    packet[12] = bytes4000[1];
    bleProvider.addLog("RPM 4000: $rpm4000Value PSI -> raw: $rpm4000Raw -> bytes: ${bytes4000[0]},${bytes4000[1]}");

    double rpm4500Value = double.tryParse(controllers['4500_boost']!.text) ?? 0.0;
    int rpm4500Raw = (rpm4500Value * 10.0).round();
    List<int> bytes4500 = _wordToBytes(rpm4500Raw);
    packet[13] = bytes4500[0];
    packet[14] = bytes4500[1];
    bleProvider.addLog("RPM 4500: $rpm4500Value PSI -> raw: $rpm4500Raw -> bytes: ${bytes4500[0]},${bytes4500[1]}");

    double rpm5000Value = double.tryParse(controllers['5000_boost']!.text) ?? 0.0;
    int rpm5000Raw = (rpm5000Value * 10.0).round();
    List<int> bytes5000 = _wordToBytes(rpm5000Raw);
    packet[15] = bytes5000[0];
    packet[16] = bytes5000[1];
    bleProvider.addLog("RPM 5000: $rpm5000Value PSI -> raw: $rpm5000Raw -> bytes: ${bytes5000[0]},${bytes5000[1]}");

    double rpm5500Value = double.tryParse(controllers['5500_boost']!.text) ?? 0.0;
    int rpm5500Raw = (rpm5500Value * 10.0).round();
    List<int> bytes5500 = _wordToBytes(rpm5500Raw);
    packet[17] = bytes5500[0];
    packet[18] = bytes5500[1];
    bleProvider.addLog("RPM 5500: $rpm5500Value PSI -> raw: $rpm5500Raw -> bytes: ${bytes5500[0]},${bytes5500[1]}");

    double rpm6000Value = double.tryParse(controllers['6000_boost']!.text) ?? 0.0;
    int rpm6000Raw = (rpm6000Value * 10.0).round();
    List<int> bytes6000 = _wordToBytes(rpm6000Raw);
    packet[19] = bytes6000[0];
    packet[20] = bytes6000[1];
    bleProvider.addLog("RPM 6000: $rpm6000Value PSI -> raw: $rpm6000Raw -> bytes: ${bytes6000[0]},${bytes6000[1]}");

    double rpm6500Value = double.tryParse(controllers['6500_boost']!.text) ?? 0.0;
    int rpm6500Raw = (rpm6500Value * 10.0).round();
    List<int> bytes6500 = _wordToBytes(rpm6500Raw);
    packet[21] = bytes6500[0];
    packet[22] = bytes6500[1];
    bleProvider.addLog("RPM 6500: $rpm6500Value PSI -> raw: $rpm6500Raw -> bytes: ${bytes6500[0]},${bytes6500[1]}");

    double rpm7000Value = double.tryParse(controllers['7000_boost']!.text) ?? 0.0;
    int rpm7000Raw = (rpm7000Value * 10.0).round();
    List<int> bytes7000 = _wordToBytes(rpm7000Raw);
    packet[23] = bytes7000[0];
    packet[24] = bytes7000[1];
    bleProvider.addLog("RPM 7000: $rpm7000Value PSI -> raw: $rpm7000Raw -> bytes: ${bytes7000[0]},${bytes7000[1]}");
    double m1BoostLimitValue = double.tryParse(controllers['m1BoostLimit']!.text) ?? 0.0;
    int m1BoostLimitRaw = (m1BoostLimitValue * 10).round(); // Multiply by 10 once to match C# implementation
    List<int> m1BoostLimitBytes = _wordToBytes(m1BoostLimitRaw);
    packet[25] = m1BoostLimitBytes[0];
    packet[26] = m1BoostLimitBytes[1];
    bleProvider.addLog("M1 Boost Limit (bytes 25-26): $m1BoostLimitValue PSI -> raw: $m1BoostLimitRaw -> bytes: ${m1BoostLimitBytes[0]},${m1BoostLimitBytes[1]}");
    int feedForward = int.tryParse(controllers['feedForward']!.text) ?? 0;
    packet[27] = feedForward;
    bleProvider.addLog("Feed Forward (byte 27): $feedForward");
    int methTrigger = int.tryParse(controllers['methTrigger']!.text) ?? 0;
    packet[28] = methTrigger;
    bleProvider.addLog("Meth Trigger (byte 28): $methTrigger");
    double boostLimit1st = double.tryParse(controllers['boostLimit1st']!.text) ?? 0.0;
    packet[29] = boostLimit1st.round();
    bleProvider.addLog("Boost Limit 1st (byte 29): $boostLimit1st");
    int futureUseA = int.tryParse(controllers['futureUseA']!.text) ?? 0;
    packet[30] = futureUseA;
    bleProvider.addLog("Future Use A (byte 30): $futureUseA");
    int m1LagFix = int.tryParse(controllers['m1LagFix']!.text) ?? 0;
    packet[31] = m1LagFix;
    bleProvider.addLog("M1 Lag Fix (byte 31): $m1LagFix");
    packet[32] = 0;
    bleProvider.addLog("FUD bits (byte 32): 0");
    int pidGain = int.tryParse(controllers['m1PidGain']!.text) ?? 0;
    packet[33] = pidGain;
    bleProvider.addLog("PID Gain (byte 33): $pidGain");
    int openLoop = int.tryParse(controllers['openLoop']!.text) ?? 0;
    packet[34] = openLoop;
    bleProvider.addLog("Open Loop (byte 34): $openLoop");
    int m1Throttle = int.tryParse(controllers['m1Throttle']!.text) ?? 0;
    packet[35] = m1Throttle;
    bleProvider.addLog("M1 Throttle (byte 35): $m1Throttle");
    double boostLimit2nd = double.tryParse(controllers['boostLimit2nd']!.text) ?? 0.0;
    packet[36] = boostLimit2nd.round();
    bleProvider.addLog("Boost Limit 2nd (byte 36): $boostLimit2nd");
    int methSafety = int.tryParse(controllers['methSafety']!.text) ?? 0;
    packet[37] = methSafety;
    bleProvider.addLog("Meth Safety (byte 37): $methSafety");
    int tmapSensor = int.tryParse(controllers['tmap35bar']!.text) ?? 0;
    packet[38] = tmapSensor;
    bleProvider.addLog("TMAP Sensor (byte 38): $tmapSensor");
    double boostLimit3rd = double.tryParse(controllers['boostLimit3rd']!.text) ?? 0.0;
    packet[39] = boostLimit3rd.round();
    bleProvider.addLog("Boost Limit 3rd (byte 39): $boostLimit3rd");
    bleProvider.addLog("Advanced settings bytes 25-39: [${packet.sublist(25, 40).map((b) => b.toRadixString(16).padLeft(2, '0').toUpperCase()).join(', ')}]");
    final List<String> fuelKeys = [
      '3000_fuelBias', '3500_fuelBias', '4000_fuelBias', 
      '4500_fuelBias', '5000_fuelBias', '5500_fuelBias',
      '6000_fuelBias', '6500_fuelBias', '7000_fuelBias'
    ];
    for (int i = 0; i < fuelKeys.length; i++) {
      packet[40 + i] = int.tryParse(controllers[fuelKeys[i]]!.text) ?? 0;
    }
    bleProvider.addLog("Fuel settings bytes 40-48: ${packet.sublist(40, 49)}");
    packet[49] = int.tryParse(controllers['sixCylTimingLogging']!.text) ?? 0;
    final List<String> cpsKeys = [
      '1500_dutyBias', '2000_dutyBias', '2500_dutyBias',
      '3000_dutyBias', '3500_dutyBias', '4000_dutyBias',
      '4500_dutyBias', '5000_dutyBias', '5500_dutyBias',
      '6000_dutyBias', '6500_dutyBias', '7000_dutyBias'
    ];
    for (int i = 0; i < cpsKeys.length; i++) {
      packet[50 + i] = int.tryParse(controllers[cpsKeys[i]]!.text) ?? 0;
    }
    bleProvider.addLog("CPS values bytes 50-61: ${packet.sublist(50, 62)}");
    int checksum = 0;
    for (int i = 1; i < 62; i++) {
      checksum += packet[i];
    }
    packet[62] = checksum % 256;
    bleProvider.addLog("Computed checksum: $checksum -> ${packet[62]}");
    packet[63] = 35; // ASCII '#'
    bleProvider.addLog("Complete MAP1 packet: ${packet.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ')}");
    return packet;
  }

  bool _wmiValid() {
    final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
    double tempMAX;
    int tempMAXInt;
    String tmapSensorValue = controllers['tmap35bar']!.text;
    if (tmapSensorValue == "1") {
      tempMAX = 36.1;
      tempMAXInt = 140;
      bleProvider.addLog("TMAP sensor type 1 (3.5 bar): WMI max boost limit set to $tempMAX PSI, max value $tempMAXInt");
    } else if (tmapSensorValue == "2") {
      tempMAX = 43.0;
      tempMAXInt = 140;
      bleProvider.addLog("TMAP sensor type 2 (4.0 bar): WMI max boost limit set to $tempMAX PSI, max value $tempMAXInt");
    } else {
      tempMAX = 20.0;
      tempMAXInt = 80;
      bleProvider.addLog("TMAP sensor type unknown: WMI max boost limit set to $tempMAX PSI, max value $tempMAXInt");
    }
    tempMAX = 60.0;
    tempMAXInt = 255;
    bleProvider.addLog("Global override applied: WMI max boost limit set to $tempMAX PSI, max value $tempMAXInt");

    try {
      double tempd = double.tryParse(controllers['n1MinPsi']!.text) ?? 0.0;
      if (tempd < 0 || tempd > tempMAX) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: Text("Valid range is 0-$tempMAX PSI"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1MinPsi value $tempd out of range (0-$tempMAX)");
        return false;
      }
      int temp = int.tryParse(controllers['n1Enabled']!.text) ?? 0;
      if (temp < 0 || temp > 255) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-255"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1Enabled value $temp out of range (0-255)");
        return false;
      }
      tempd = double.tryParse(controllers['n1MinRpm']!.text) ?? 0.0;
      if (tempd < 0 || tempd > 10000) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-10000rpm"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1MinRpm value $tempd out of range (0-10000)");
        return false;
      }
      tempd = double.tryParse(controllers['n1MaxRpm']!.text) ?? 0.0;
      if (tempd < 0 || tempd > 10000) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-10000rpm"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1MaxRpm value $tempd out of range (0-10000)");
        return false;
      }
      temp = int.tryParse(controllers['n1RampRate']!.text) ?? 0;
      if (temp < 0 || temp > 255) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-255"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1RampRate value $temp out of range (0-255)");
        return false;
      }
      temp = int.tryParse(controllers['virtualFfOffset']!.text) ?? 0;
      if (temp < 0 || temp > 255) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-255"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: VirtualFfOffset value $temp out of range (0-255)");
        return false;
      }
      temp = int.tryParse(controllers['m1MethHard']!.text) ?? 0;
      if (temp < 0 || temp > tempMAXInt) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: Text("Valid range is 0-$tempMAXInt"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: M1MethHard value $temp out of range (0-$tempMAXInt)");
        return false;
      }
      temp = int.tryParse(controllers['methRange']!.text) ?? 0;
      if (temp < 0 || temp > 255) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-255"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: MethRange value $temp out of range (0-255)");
        return false;
      }
      temp = int.tryParse(controllers['n1MinGear']!.text) ?? 0;
      if (temp < 0 || temp > 255) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-255"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1MinGear value $temp out of range (0-255)");
        return false;
      }
      temp = int.tryParse(controllers['n1MinAfr']!.text) ?? 0;
      if (temp < 0 || temp > 255) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-255"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1MinAfr value $temp out of range (0-255)");
        return false;
      }
      temp = int.tryParse(controllers['n1MinAdvance']!.text) ?? 0;
      if (temp < 0 || temp > 255) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text("Validation Error"),
              content: const Text("Valid range is 0-255"),
              actions: [
                TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
              ],
            );
          },
        );
        bleProvider.addLog("WMI validation failed: N1MinAdvance value $temp out of range (0-255)");
        return false;
      }
      bleProvider.addLog("WMI validation passed");
      return true;
    } catch (e) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text("Validation Error"),
            content: Text("Invalid Value -- Exception: $e"),
            actions: [
              TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
            ],
          );
        },
      );
      bleProvider.addLog("WMI validation failed with exception: $e");
      return false;
    }
  }

  List<int> _getWmiSettingsPacket() {
    if (!_wmiValid()) return [];
    final bleProvider = Provider.of<JB4BleProvider>(context, listen: false);
    List<int> packet = List<int>.filled(26, 0);
    bleProvider.addLog("Building WMI settings packet (26 bytes)");
    packet[0] = 84; // ASCII 'T'
    double n1MinPsi = double.tryParse(controllers['n1MinPsi']!.text) ?? 0.0;
    int n1MinPsiRaw = n1MinPsi.round();
    List<int> psiBytes = _wordToBytes(n1MinPsiRaw);
    packet[1] = psiBytes[0];
    packet[2] = psiBytes[1];
    bleProvider.addLog("N1MinPsi (bytes 1-2): $n1MinPsi PSI -> raw: $n1MinPsiRaw -> bytes: ${psiBytes[0]},${psiBytes[1]}");
    int n1Enabled = int.tryParse(controllers['n1Enabled']!.text) ?? 0;
    List<int> enabledBytes = _wordToBytes(n1Enabled);
    packet[3] = enabledBytes[0];
    packet[4] = enabledBytes[1];
    bleProvider.addLog("N1Enabled (bytes 3-4): $n1Enabled -> bytes: ${enabledBytes[0]},${enabledBytes[1]}");
    int ethanolBits = bleProvider.ethanolSetup & 0x0F;
    if (bleProvider.scalePiOnFlexFuel) ethanolBits |= 0x10;
    if (bleProvider.startupE85Indicator) ethanolBits |= 0x20;
    if (bleProvider.blockedInUSA) ethanolBits |= 0x40;
    if (bleProvider.enableWmiPumpPwm) ethanolBits |= 0x80;
    packet[5] = 0;
    packet[6] = 0;
    packet[5] = ethanolBits;
    packet[6] = ethanolBits;
    StringBuffer bitsLog = StringBuffer();
    bitsLog.write("E85 Bits (bytes 5-6): 0x${ethanolBits.toRadixString(16).padLeft(2, '0')} [");
    bitsLog.write(bleProvider.ethanolSetup > 0 ? "FlexFuel Input ${bleProvider.ethanolSetup}, " : "");
    bitsLog.write(bleProvider.scalePiOnFlexFuel ? "Scale PI, " : "");
    bitsLog.write(bleProvider.startupE85Indicator ? "E85 Indicator, " : "");
    bitsLog.write(bleProvider.blockedInUSA ? "Blocked USA, " : "");
    bitsLog.write(bleProvider.enableWmiPumpPwm ? "WMI Pump PWM" : "");
    bitsLog.write("] -> bytes: ${packet[5]},${packet[6]}");
    bleProvider.addLog(bitsLog.toString());
    int n1MinRpm = int.tryParse(controllers['n1MinRpm']!.text) ?? 0;
    List<int> minRpmBytes = _wordToBytes(n1MinRpm);
    packet[7] = minRpmBytes[0];
    packet[8] = minRpmBytes[1];
    bleProvider.addLog("N1MinRpm (bytes 7-8): $n1MinRpm RPM -> bytes: ${minRpmBytes[0]},${minRpmBytes[1]}");
    int n1MaxRpm = int.tryParse(controllers['n1MaxRpm']!.text) ?? 0;
    List<int> maxRpmBytes = _wordToBytes(n1MaxRpm);
    packet[9] = maxRpmBytes[0];
    packet[10] = maxRpmBytes[1];
    bleProvider.addLog("N1MaxRpm (bytes 9-10): $n1MaxRpm RPM -> bytes: ${maxRpmBytes[0]},${maxRpmBytes[1]}");
    int n1RampRate = int.tryParse(controllers['n1RampRate']!.text) ?? 0;
    List<int> rampRateBytes = _wordToBytes(n1RampRate);
    packet[11] = rampRateBytes[0];
    packet[12] = rampRateBytes[1];
    bleProvider.addLog("N1RampRate (bytes 11-12): $n1RampRate -> bytes: ${rampRateBytes[0]},${rampRateBytes[1]}");
    int virtualFfOffset = int.tryParse(controllers['virtualFfOffset']!.text) ?? 0;
    List<int> vffBytes = _wordToBytes(virtualFfOffset);
    packet[13] = vffBytes[0];
    packet[14] = vffBytes[1];
    bleProvider.addLog("VirtualFfOffset (bytes 13-14): $virtualFfOffset -> bytes: ${vffBytes[0]},${vffBytes[1]}");
    int m1MethHard = int.tryParse(controllers['m1MethHard']!.text) ?? 0;
    List<int> methHardBytes = _wordToBytes(m1MethHard);
    packet[15] = methHardBytes[0];
    packet[16] = methHardBytes[1];
    bleProvider.addLog("M1MethHard (bytes 15-16): $m1MethHard -> bytes: ${methHardBytes[0]},${methHardBytes[1]}");
    int methRange = int.tryParse(controllers['methRange']!.text) ?? 0;
    List<int> methRangeBytes = _wordToBytes(methRange);
    packet[17] = methRangeBytes[0];
    packet[18] = methRangeBytes[1];
    bleProvider.addLog("MethRange (bytes 17-18): $methRange -> bytes: ${methRangeBytes[0]},${methRangeBytes[1]}");
    int n1MinGear = int.tryParse(controllers['n1MinGear']!.text) ?? 0;
    List<int> minGearBytes = _wordToBytes(n1MinGear);
    packet[19] = minGearBytes[0];
    packet[20] = minGearBytes[1];
    bleProvider.addLog("N1MinGear (bytes 19-20): $n1MinGear -> bytes: ${minGearBytes[0]},${minGearBytes[1]}");
    int n1MinAfr = int.tryParse(controllers['n1MinAfr']!.text) ?? 0;
    List<int> minAfrBytes = _wordToBytes(n1MinAfr);
    packet[21] = minAfrBytes[0];
    packet[22] = minAfrBytes[1];
    bleProvider.addLog("N1MinAfr (bytes 21-22): $n1MinAfr -> bytes: ${minAfrBytes[0]},${minAfrBytes[1]}");
    int n1MinAdvance = int.tryParse(controllers['n1MinAdvance']!.text) ?? 0;
    List<int> minAdvBytes = _wordToBytes(n1MinAdvance);
    packet[23] = minAdvBytes[0];
    packet[24] = minAdvBytes[1];
    bleProvider.addLog("N1MinAdvance (bytes 23-24): $n1MinAdvance -> bytes: ${minAdvBytes[0]},${minAdvBytes[1]}");
    packet[25] = 36; // ASCII '$'
    bleProvider.addLog("Complete WMI packet: ${packet.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ')}");
    return packet;
  }

  List<int> _wordToBytes(int input) {
    int temp = (input ~/ 256); // Integer division for high byte
    int temp2 = input % 256;   // Modulo for low byte
    return [temp, temp2];      // High byte first, low byte second
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<JB4BleProvider>(
      builder: (context, bleProvider, child) {
        if (!bleProvider.isLoadingSettings && !_populated) {
          _populateControllers(bleProvider);
          _populated = true;
        }
        return DefaultTabController(
          length: 4,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('User Adjustment'),
              bottom: const TabBar(
                tabs: [
                  Tab(text: 'RPM Table'),
                  Tab(text: 'Advanced'),
                  Tab(text: 'WMI'),
                  Tab(text: 'Info'),
                ],
              ),
            ),
            // Wrapping each tab in SingleChildScrollView so all values can be reached
            body: TabBarView(
              children: [
                SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: _buildRPMTable(),
                  ),
                ),
                SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: _buildAdvancedSettings(),
                  ),
                ),
                SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: _buildWmiSettings(),
                  ),
                ),
                SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: _buildReadOnlyInfo(),
                  ),
                ),
              ],
            ),
            // Bottom navigation now contains only the Save button.
            bottomNavigationBar: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton(
                    onPressed: _isSaving
                        ? null
                        : () async {
                            setState(() => _isSaving = true);
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
                                      Text("Saving settings..."),
                                    ],
                                  ),
                                );
                              },
                            );
                            try {
                              bleProvider.addLog("Starting settings save process...");
                              await bleProvider.prepareForSettingsSave();
                              List<int> settingsPacket = _getSettingsPacket();
                              if (settingsPacket.isEmpty) {
                                throw Exception("MAP1 settings validation failed");
                              }
                              bleProvider.addLog("Sending MAP1 settings packet (64 bytes) byte-by-byte");
                              for (int i = 0; i < settingsPacket.length; i++) {
                                await bleProvider.sendSingleByte(settingsPacket[i]);
                                await Future.delayed(const Duration(milliseconds: 25));
                              }
                              bleProvider.addLog("MAP1 settings packet sent successfully");
                              await Future.delayed(const Duration(milliseconds: 800));
                              bleProvider.clearAsciiBuffer();
                              await Future.delayed(const Duration(milliseconds: 200));
                              List<int> wmiPacket = _getWmiSettingsPacket();
                              if (wmiPacket.isEmpty) {
                                throw Exception("WMI settings validation failed");
                              }
                              bleProvider.addLog("Sending WMI settings packet (26 bytes) byte-by-byte");
                              for (int i = 0; i < wmiPacket.length; i++) {
                                await bleProvider.sendSingleByte(wmiPacket[i]);
                                await Future.delayed(const Duration(milliseconds: 25));
                              }
                              bleProvider.addLog("WMI settings packet sent successfully");
                              await Future.delayed(const Duration(milliseconds: 800));
                              bleProvider.addLog("Sending E85 bits settings...");
                              int ethanolBits = bleProvider.ethanolSetup & 0x0F;
                              if (bleProvider.scalePiOnFlexFuel) ethanolBits |= 0x10;
                              if (bleProvider.startupE85Indicator) ethanolBits |= 0x20;
                              if (bleProvider.blockedInUSA) ethanolBits |= 0x40;
                              if (bleProvider.enableWmiPumpPwm) ethanolBits |= 0x80;
                              String e85Command = "R" + ethanolBits.toString();
                              await bleProvider.sendAsciiCommand(e85Command);
                              await Future.delayed(const Duration(milliseconds: 500));
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
                              await bleProvider.sendAsciiCommand("A");
                              bleProvider.addLog("Resumed logging after saving settings");
                              await Future.delayed(const Duration(milliseconds: 500));
                              await bleProvider.fetchSettings();
                              int attempts = 0;
                              while (!bleProvider.isLoadingSettings && attempts < 10) {
                                await Future.delayed(const Duration(milliseconds: 100));
                                attempts++;
                              }
                              setState(() {
                                _populated = false;
                              });
                              Navigator.of(context).pop(); // Close saving dialog
                              showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return AlertDialog(
                                    title: Text("Success", style: TextStyle(color: Colors.green)),
                                    content: Text("Settings saved successfully"),
                                    actions: [
                                      TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
                                    ],
                                  );
                                },
                              );
                            } catch (e) {
                              bleProvider.addLog("Error saving settings: $e");
                              Navigator.of(context).pop();
                              showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return AlertDialog(
                                    title: const Text("Error", style: TextStyle(color: Colors.red)),
                                    content: Text("Failed to save settings: $e"),
                                    actions: [
                                      TextButton(child: const Text("OK"), onPressed: () => Navigator.of(context).pop()),
                                    ],
                                  );
                                },
                              );
                            } finally {
                              setState(() => _isSaving = false);
                            }
                          },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      child: Text(_isSaving ? 'Saving...' : 'Save', style: const TextStyle(fontSize: 18)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRPMTable() {
    final List<int> rpms = [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000];
    return DataTable(
      columnSpacing: 10,
      dataRowHeight: 40,
      headingRowHeight: 40,
      columns: const [
        DataColumn(label: Text('RPM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
        DataColumn(label: Text('Boost', style: TextStyle(fontSize: 14))),
        DataColumn(label: Text('Fuel Bias', style: TextStyle(fontSize: 14))),
        DataColumn(label: Text('Duty Bias', style: TextStyle(fontSize: 14))),
      ],
      rows: rpms.map((rpm) {
        return DataRow(cells: [
          DataCell(Text('$rpm', style: const TextStyle(fontSize: 14))),
          DataCell(_smallTextField('${rpm}_boost')),
          DataCell(_smallTextField('${rpm}_fuelBias')),
          DataCell(_smallTextField('${rpm}_dutyBias')),
        ]);
      }).toList(),
    );
  }

  Widget _buildAdvancedSettings() {
    final List<List<String>> settings = [
      ['Boost Safety', 'm1BoostLimit'],
      ['Wastegate Pos.', 'feedForward'],
      ['PID Gain', 'm1PidGain'],
      ['Auto Shift Red', 'm1Throttle'],
      ['Meth Trigger Mode', 'methTrigger'],
      ['Max Boost 1st', 'boostLimit1st'],
      ['Max Boost 2nd', 'boostLimit2nd'],
      ['Max Boost 3rd', 'boostLimit3rd'],
      ['Fuel Open Loop', 'openLoop'],
      ['Meth Safety Mode', 'methSafety'],
      ['M1 Lag Fix', 'm1LagFix'],
    ];
    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 4.5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: settings.map((s) => _labeledTextField(s[0], s[1])).toList(),
    );
  }

  Widget _buildWmiSettings() {
    final List<List<String>> settings = [
      ['Min PSI', 'n1MinPsi'],
      ['Enabled', 'n1Enabled'],
      ['Min RPM', 'n1MinRpm'],
      ['Max RPM', 'n1MaxRpm'],
      ['Ramp Rate', 'n1RampRate'],
      ['Virtual FF Offset', 'virtualFfOffset'],
      ['Meth Hard', 'm1MethHard'],
      ['Meth Range', 'methRange'],
      ['Min Gear', 'n1MinGear'],
      ['Min AFR', 'n1MinAfr'],
      ['Min Advance', 'n1MinAdvance'],
    ];
    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 4.5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: settings.map((s) => _labeledTextField(s[0], s[1])).toList(),
    );
  }

  Widget _buildReadOnlyInfo() {
    final List<List<String>> info = [
      ['TMAP Voltage', 'tmapVoltage'],
      ['Firmware Ver', 'firmwareVer'],
      ['Interface Ver', 'interfaceVer'],
      ['JB4 Address', 'jb4Address'],
      ['VIN', 'vin'],
      ['Country', 'country'],
      ['Learned Ign', 'learnedIgn'],
      ['Last Safety', 'lastSafety'],
      ['Future Use A', 'futureUseA'],
      ['TMAP 3.5bar', 'tmap35bar'],
      ['6-Cyl Timing Log', 'sixCylTimingLogging'],
    ];
    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 4.5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: info.map((s) => _labeledTextField(s[0], s[1])).toList(),
    );
  }

  Widget _smallTextField(String key) {
    return SizedBox(
      width: 50,
      height: 40,
      child: TextField(
        controller: controllers[key],
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 14),
        decoration: const InputDecoration(
          isDense: true,
          border: OutlineInputBorder(),
          contentPadding: EdgeInsets.symmetric(vertical: 6, horizontal: 6),
        ),
      ),
    );
  }

  Widget _labeledTextField(String label, String controllerKey) {
    return Padding(
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(fontSize: 14)),
          ),
          Expanded(
            child: SizedBox(
              height: 45,
              child: TextField(
                controller: controllers[controllerKey],
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14),
                decoration: const InputDecoration(
                  isDense: true,
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
