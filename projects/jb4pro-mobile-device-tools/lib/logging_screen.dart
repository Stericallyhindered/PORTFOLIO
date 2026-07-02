// lib/logging_screen.dart
//
// This file implements an interactive logging screen that:
// • Generates CSV logs matching the JB4 log format (headers match the C program).
// • Provides Start/Stop buttons (and auto‐start/stop based on TPS thresholds).
// • Saves CSV logs locally and lists them for viewing.
// • Allows tapping a log to view its graph and email the CSV file.
// • Supports selecting individual logs for deletion and a long press on the delete button to prompt deletion of all logs.
// 
// This version uses syncfusion_flutter_charts for graphing, the csv package
// (https://pub.dev/packages/csv) to generate the CSV file content, and
// flutter_email_sender (https://pub.dev/packages/flutter_email_sender) to send the CSV file
// as an email attachment.
// Ensure you have these dependencies in your pubspec.yaml:
//   flutter_reactive_ble, provider, path_provider, flutter_email_sender, permission_handler, intl, csv
//
// Then run: flutter clean && flutter pub get

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_charts/charts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:flutter_email_sender/flutter_email_sender.dart';
import 'package:intl/intl.dart';

import 'providers/ble_provider.dart';

/// LogPoint holds a single logged data entry in the JB4 format.
class LogPoint {
  final double timestamp;
  final int rpm;
  final double dmeBoost;
  final double dmeTarget;
  final double boost;
  final int tps;
  final int iat;
  final int fuel;
  final int pwm;
  final int accel;
  final double fuelp;
  final double ignadv;
  final double avgign;
  final double afr;
  final double egt;
  final double dmeBt;
  final int meth;
  final int oiltemp;
  final double afr2;
  final int gear;
  final int ffPid;
  final double cps;
  final int clock;
  final int map;
  final double kr1;
  final double kr2;
  final double kr3;
  final double kr4;
  final double kr5;
  final double kr6;
  final int oilf;
  final int waterf;
  final int transf;
  final int e85;
  final double boost2;
  final double trims2;
  final int mph;
  final int kr7;
  final int kr8;
  final int aux1;
  final int aux2;
  final int aux3;
  final int aux4;
  final int aux5;
  final int aux6;
  final int maf1;
  final int maf2;

  LogPoint({
    required this.timestamp,
    required this.rpm,
    required this.dmeBoost,
    required this.dmeTarget,
    required this.boost,
    required this.tps,
    required this.iat,
    required this.fuel,
    required this.pwm,
    required this.accel,
    required this.fuelp,
    required this.ignadv,
    required this.avgign,
    required this.afr,
    required this.egt,
    required this.dmeBt,
    required this.meth,
    required this.oiltemp,
    required this.afr2,
    required this.gear,
    required this.ffPid,
    required this.cps,
    required this.clock,
    required this.map,
    required this.kr1,
    required this.kr2,
    required this.kr3,
    required this.kr4,
    required this.kr5,
    required this.kr6,
    required this.oilf,
    required this.waterf,
    required this.transf,
    required this.e85,
    required this.boost2,
    required this.trims2,
    required this.mph,
    required this.kr7,
    required this.kr8,
    required this.aux1,
    required this.aux2,
    required this.aux3,
    required this.aux4,
    required this.aux5,
    required this.aux6,
    required this.maf1,
    required this.maf2,
  });

  /// Returns a list of values representing this log entry.
  List<dynamic> toCsvRow() {
    return [
      timestamp.toStringAsFixed(2), // Format to 2 decimal places like in C# output
      rpm,
      dmeBoost.toStringAsFixed(1),
      dmeTarget.toStringAsFixed(1),
      boost.toStringAsFixed(1),
      tps,
      iat,
      fuel,
      pwm,
      accel,
      fuelp.toStringAsFixed(2),
      ignadv.toStringAsFixed(1),
      avgign.toStringAsFixed(1),
      afr.toStringAsFixed(2),
      egt.toStringAsFixed(1),
      dmeBt.toStringAsFixed(1),
      meth,
      oiltemp,
      afr2.toStringAsFixed(1),
      gear,
      ffPid,
      cps.toStringAsFixed(1),
      clock,
      map,
      kr1.toStringAsFixed(1),
      kr2.toStringAsFixed(1),
      kr3.toStringAsFixed(1),
      kr4.toStringAsFixed(1),
      kr5.toStringAsFixed(1),
      kr6.toStringAsFixed(1),
      oilf,
      waterf,
      transf,
      e85,
      boost2.toStringAsFixed(1),
      trims2.toStringAsFixed(1),
      mph,
      kr7,
      kr8,
      aux1,
      aux2,
      aux3,
      aux4,
      aux5,
      aux6,
      maf1,
      maf2,
    ];
  }
}

/// CsvLogger generates CSV content from a list of LogPoints using the csv package.
class CsvLogger {
  final List<LogPoint> logPoints;
  final BuildContext context;
  
  CsvLogger(this.logPoints, this.context);

  String generateCsv() {
    // Define header rows as lists, exactly as in Form1.cs
    List<List<dynamic>> csvData = [
      [
        "Firmware",
        "Interface",
        "JB4_MAC_Address",
        "TMAP_V",
        "Learned_Ign",
        "DWP",
        "MethTriggerMode",
        "FF",
        "MethSafeMode",
        "MethAdd",
        "MethScale",
        "MethPSI",
        "VIN",
        "E85_Setup",
        "VFF_Offset",
        "",
        "fuel_30",
        "fuel_35",
        "fuel_40",
        "fuel_45",
        "fuel_50",
        "fuel_55",
        "fuel_60",
        "fuel_65",
        "fuel_70",
        "map6_15",
        "map6_20",
        "map6_25",
        "map6_30",
        "map6_35",
        "map6_40",
        "map6_45",
        "map6_50",
        "map6_55",
        "map6_60",
        "map6_65",
        "map6_70"
      ],
      // First data row - populated with actual configuration values from BleProvider
      [
        Provider.of<JB4BleProvider>(context, listen: false).jb4Firmware,
        Provider.of<JB4BleProvider>(context, listen: false).interfaceVer,
        Provider.of<JB4BleProvider>(context, listen: false).vin,
        Provider.of<JB4BleProvider>(context, listen: false).ambientVoltage,
        Provider.of<JB4BleProvider>(context, listen: false).avgIgnDrop,
        Provider.of<JB4BleProvider>(context, listen: false).m1LagFix,
        Provider.of<JB4BleProvider>(context, listen: false).methTrigger,
        Provider.of<JB4BleProvider>(context, listen: false).feedForward,
        Provider.of<JB4BleProvider>(context, listen: false).methSafety,
        Provider.of<JB4BleProvider>(context, listen: false).m1MethHard,
        Provider.of<JB4BleProvider>(context, listen: false).methRange,
        Provider.of<JB4BleProvider>(context, listen: false).n1MinPsi,
        Provider.of<JB4BleProvider>(context, listen: false).vin,
        Provider.of<JB4BleProvider>(context, listen: false).e85Bits.toString(),
        Provider.of<JB4BleProvider>(context, listen: false).virtualFfOffset,
        "", // empty column
        Provider.of<JB4BleProvider>(context, listen: false).fuel2500,
        Provider.of<JB4BleProvider>(context, listen: false).fuel3000,
        Provider.of<JB4BleProvider>(context, listen: false).fuel3500,
        Provider.of<JB4BleProvider>(context, listen: false).fuel4000,
        Provider.of<JB4BleProvider>(context, listen: false).fuel4500,
        Provider.of<JB4BleProvider>(context, listen: false).fuel5000,
        Provider.of<JB4BleProvider>(context, listen: false).fuel5500,
        Provider.of<JB4BleProvider>(context, listen: false).fuel6000,
        Provider.of<JB4BleProvider>(context, listen: false).fuel6500,
        Provider.of<JB4BleProvider>(context, listen: false).rpm1500,
        Provider.of<JB4BleProvider>(context, listen: false).rpm2000,
        Provider.of<JB4BleProvider>(context, listen: false).rpm2500,
        Provider.of<JB4BleProvider>(context, listen: false).rpm3000,
        Provider.of<JB4BleProvider>(context, listen: false).rpm3500,
        Provider.of<JB4BleProvider>(context, listen: false).rpm4000,
        Provider.of<JB4BleProvider>(context, listen: false).rpm4500,
        Provider.of<JB4BleProvider>(context, listen: false).rpm5000,
        Provider.of<JB4BleProvider>(context, listen: false).rpm5500,
        Provider.of<JB4BleProvider>(context, listen: false).rpm6000,
        Provider.of<JB4BleProvider>(context, listen: false).rpm6500,
        Provider.of<JB4BleProvider>(context, listen: false).rpm7000,
      ],
      [
        "BoostSafety",
        "PID Gain",
        "AutoShiftRed",
        "Fuel_OL",
        "FUA",
        "1st_limiter",
        "2nd_limiter",
        "3rd_limiter",
        "Options",
        "N20_TMAP",
        "6CylMode",
        "LastSafety",
        "",
        "duty_15",
        "duty_20",
        "duty_25",
        "duty_30",
        "duty_35",
        "duty_40",
        "duty_45",
        "duty_50",
        "duty_55",
        "duty_60",
        "duty_65",
        "duty_70",
        "",
        "et_enabled",
        "et_n1minrpm",
        "et_n1maxrpm",
        "et_n1ramprate",
        "et_n1mingear",
        "et_n1minadv",
        "et_n1minafr"
      ],
      // Second data row
      [
        Provider.of<JB4BleProvider>(context, listen: false).m1BoostLimit,
        Provider.of<JB4BleProvider>(context, listen: false).m1PidGain,
        Provider.of<JB4BleProvider>(context, listen: false).m1Throttle,
        Provider.of<JB4BleProvider>(context, listen: false).openLoop,
        Provider.of<JB4BleProvider>(context, listen: false).futureUseA,
        Provider.of<JB4BleProvider>(context, listen: false).boostLimit1st,
        Provider.of<JB4BleProvider>(context, listen: false).boostLimit2nd,
        Provider.of<JB4BleProvider>(context, listen: false).boostLimit3rd,
        Provider.of<JB4BleProvider>(context, listen: false).fudBits.toString(),
        Provider.of<JB4BleProvider>(context, listen: false).tmapSensor,
        Provider.of<JB4BleProvider>(context, listen: false).sixCylTiming,
        Provider.of<JB4BleProvider>(context, listen: false).lastSafety,
        "", // empty column
        Provider.of<JB4BleProvider>(context, listen: false).cps1500,
        Provider.of<JB4BleProvider>(context, listen: false).cps2000,
        Provider.of<JB4BleProvider>(context, listen: false).cps2500,
        Provider.of<JB4BleProvider>(context, listen: false).cps3000,
        Provider.of<JB4BleProvider>(context, listen: false).cps3500,
        Provider.of<JB4BleProvider>(context, listen: false).cps4000,
        Provider.of<JB4BleProvider>(context, listen: false).cps4500,
        Provider.of<JB4BleProvider>(context, listen: false).cps5000,
        Provider.of<JB4BleProvider>(context, listen: false).cps5500,
        Provider.of<JB4BleProvider>(context, listen: false).cps6000,
        Provider.of<JB4BleProvider>(context, listen: false).cps6500,
        Provider.of<JB4BleProvider>(context, listen: false).cps7000,
        "", // empty column
        Provider.of<JB4BleProvider>(context, listen: false).n1Enabled,
        Provider.of<JB4BleProvider>(context, listen: false).n1MinRpm,
        Provider.of<JB4BleProvider>(context, listen: false).n1MaxRpm,
        Provider.of<JB4BleProvider>(context, listen: false).n1RampRate,
        Provider.of<JB4BleProvider>(context, listen: false).n1MinGear,
        Provider.of<JB4BleProvider>(context, listen: false).n1MinAdvance,
        Provider.of<JB4BleProvider>(context, listen: false).n1MinAfr,
      ],
      [
        "timestamp",
        "rpm",
        "ecu_psi",
        "target",
        "boost",
        "pedal",
        "iat",
        "fuelen",
        "wgdc",
        "throttle",
        "fp_h",
        "ign_1",
        "avg_ign",
        "calc_torque",
        "trims",
        "dme_bt",
        "meth",
        "fp_l",
        "afr",
        "gear",
        "ff",
        "load",
        "clock",
        "map",
        "afr2",
        "ign_2",
        "ign_3",
        "ign_4",
        "ign_5",
        "ign_6",
        "oilf",
        "waterf",
        "transf",
        "e85",
        "boost2",
        "trims2",
        "mph",
        "ign_7",
        "ign_8",
        "aux_1",
        "aux_2",
        "aux_3",
        "aux_4",
        "aux_5",
        "aux_6",
        "maf",
        "maf2"
      ]
    ];

    // Add each log entry.
    for (var lp in logPoints) {
      csvData.add(lp.toCsvRow());
    }

    // Convert the list of lists into a CSV string.
    return const ListToCsvConverter().convert(csvData);
  }
}

/// Data model for graphing.
class GraphData {
  final double time;
  final int rpm;
  GraphData(this.time, this.rpm);
}

/// LoggingScreen provides the interactive logging UI.
class LoggingScreen extends StatefulWidget {
  const LoggingScreen({Key? key}) : super(key: key);

  @override
  _LoggingScreenState createState() => _LoggingScreenState();
}

class _LoggingScreenState extends State<LoggingScreen> {
  bool isLogging = false;
  List<LogPoint> currentLogPoints = [];
  Timer? logTimer;
  Timer? throttleStopTimer;
  Directory? logDir;
  List<FileSystemEntity> logFiles = [];
  Set<String> selectedLogPaths = {};

  // Variables for matching sampling intervals exactly.
  double sampleTimestamp = 0.0; // Used to generate fixed timestamp intervals.
  int maxTpsDuringLog = 0;      // Track the highest TPS during logging.
  String lastRpm = "0";         // Track last RPM to detect changes
  bool boostSampleEnabled = false; // Flag for boost sample mode

  @override
  void initState() {
    super.initState();
    _initLogDir();
  }

  Future<void> _initLogDir() async {
    Directory appDocDir = await getApplicationDocumentsDirectory();
    logDir = Directory('${appDocDir.path}/logs');
    if (!(await logDir!.exists())) {
      await logDir!.create(recursive: true);
    }
    _refreshLogFiles();
  }

  Future<void> _refreshLogFiles() async {
    if (logDir != null) {
      setState(() {
        logFiles =
            logDir!.listSync().where((f) => f.path.endsWith('.csv')).toList();
      });
    }
  }

  // Automatically check TPS from JB4BleProvider and control logging.
  void checkThrottleAndControlLogging(JB4BleProvider provider) {
    try {
      int throttle = int.tryParse(provider.tps) ?? 0;
      if (throttle >= 70 && !isLogging) {
        startLogging();
      } else if (throttle < 70 && isLogging) {
        throttleStopTimer?.cancel();
        throttleStopTimer = Timer(Duration(seconds: 3), () {
          int currentThrottle = int.tryParse(provider.tps) ?? 0;
          if (currentThrottle < 70 && isLogging) {
            stopLogging();
          }
        });
      }
    } catch (e) {
      // Handle errors if needed.
    }
  }

  void startLogging() {
    if (isLogging) return;
    setState(() {
      isLogging = true;
      currentLogPoints = [];
      sampleTimestamp = 0.0; // Reset sample timestamp.
      maxTpsDuringLog = 0;   // Reset max TPS tracking.
      lastRpm = "0";         // Reset last RPM tracking
    });
    
    // Log data every 250ms.
    logTimer = Timer.periodic(Duration(milliseconds: 250), (timer) {
      final provider = Provider.of<JB4BleProvider>(context, listen: false);
      int currentTps = int.tryParse(provider.tps) ?? 0;
      String currentRpm = provider.rpm;
      
      if (currentTps > maxTpsDuringLog) {
        maxTpsDuringLog = currentTps;
      }

      // Only log when RPM changes, RPM is 0, or boost sample flag is true
      // This exactly matches the C# logic:
      // if (((rpm.Text != lc_lastrpm) || (rpm.Text == "0") || (ll_boost_sample == true)) && (down_count > 0))
      bool shouldLog = false;
      if (currentRpm != lastRpm || currentRpm == "0" || boostSampleEnabled) {
        shouldLog = true;
      }
      
      // Always increment timestamp regardless of whether we log or not
      sampleTimestamp += 0.25;
      
      if (shouldLog) {
        // Create a log entry with the current fixed timestamp
        LogPoint lp = LogPoint(
          timestamp: sampleTimestamp,
          rpm: int.tryParse(provider.rpm) ?? 0,
          dmeBoost: double.tryParse(provider.dmeBoost) ?? 0.0,
          dmeTarget: double.tryParse(provider.dmeTarget) ?? 0.0,
          boost: double.tryParse(provider.boost) ?? 0.0,
          tps: currentTps,
          iat: int.tryParse(provider.iat) ?? 0,
          fuel: int.tryParse(provider.fuel) ?? 0,
          pwm: int.tryParse(provider.pwm) ?? 0,
          accel: int.tryParse(provider.accel) ?? 0,
          fuelp: double.tryParse(provider.fuelPressure) ?? 0.0,
          ignadv: double.tryParse(provider.ignitionAdv) ?? 0.0,
          avgign: double.tryParse(provider.avgIgn) ?? 0.0,
          afr: double.tryParse(provider.afr) ?? 0.0,
          egt: double.tryParse(provider.egt) ?? 0.0,
          dmeBt: double.tryParse(provider.dmeBt) ?? 0.0,
          meth: int.tryParse(provider.meth) ?? 0,
          oiltemp: int.tryParse(provider.oilTemp) ?? 0,
          afr2: double.tryParse(provider.afr2) ?? 0.0,
          gear: int.tryParse(provider.gear) ?? 0,
          ffPid: int.tryParse(provider.ffPid) ?? 0,
          cps: double.tryParse(provider.cpsValue) ?? 0.0,
          clock: int.tryParse(provider.clockValue) ?? 0,
          map: int.tryParse(provider.mapSelection) ?? 0,
          kr1: double.tryParse(provider.kr1) ?? 0.0,
          kr2: double.tryParse(provider.kr2) ?? 0.0,
          kr3: double.tryParse(provider.kr3) ?? 0.0,
          kr4: double.tryParse(provider.kr4) ?? 0.0,
          kr5: double.tryParse(provider.kr5) ?? 0.0,
          kr6: double.tryParse(provider.kr6) ?? 0.0,
          oilf: int.tryParse(provider.oilTemp) ?? 0,
          waterf: 0,
          transf: int.tryParse(provider.tps) ?? 0,
          e85: int.tryParse(provider.egt) ?? 0,
          boost2: double.tryParse(provider.boost2) ?? 0.0,
          trims2: double.tryParse(provider.trims2) ?? 0.0,
          mph: int.tryParse(provider.speed) ?? 0,
          kr7: int.tryParse(provider.kr7) ?? 0,
          kr8: int.tryParse(provider.kr8) ?? 0,
          aux1: int.tryParse(provider.aux1) ?? 0,
          aux2: int.tryParse(provider.aux2) ?? 0,
          aux3: int.tryParse(provider.aux3) ?? 0,
          aux4: int.tryParse(provider.aux4) ?? 0,
          aux5: int.tryParse(provider.aux5) ?? 0,
          aux6: int.tryParse(provider.aux6) ?? 0,
          maf1: int.tryParse(provider.maf1) ?? 0,
          maf2: int.tryParse(provider.maf2) ?? 0,
        );
        
        setState(() {
          currentLogPoints.add(lp);
          lastRpm = currentRpm;
        });
      }
    });
  }

  Future<String> _generateLogFileName(JB4BleProvider provider) async {
    // Get platform number from provider.
    String platformStr = (provider.platform > 0) ? provider.platform.toString() : "XX";
    // Use the provider's map selection as map number.
    String mapStr = (int.tryParse(provider.mapSelection) ?? 0) > 0
        ? provider.mapSelection
        : "XX";
    // Determine run (revision) number by scanning existing log files.
    int runNumber = 1;
    if (logDir != null) {
      List<FileSystemEntity> files = logDir!.listSync();
      // Pattern: P{platform}_M{map}_R{number}_*.csv
      RegExp regExp = RegExp(
          r'^P' +
              RegExp.escape(platformStr) +
              r'_M' +
              RegExp.escape(mapStr) +
              r'_R(\d+)_.*\.csv$');
      List<int> runNumbers = [];
      for (var file in files) {
        String name = file.uri.pathSegments.last;
        Match? match = regExp.firstMatch(name);
        if (match != null) {
          runNumbers.add(int.parse(match.group(1)!));
        }
      }
      if (runNumbers.isNotEmpty) {
        runNumber = runNumbers.reduce((a, b) => a > b ? a : b) + 1;
      }
    }
    // Format current date and time.
    DateTime now = DateTime.now();
    String dateStr = DateFormat("ddMMyy").format(now);
    String timeStr = DateFormat("HHmm").format(now);
    return "P${platformStr}_M${mapStr}_R${runNumber}_${dateStr}_${timeStr}.csv";
  }

  Future<void> stopLogging() async {
    if (!isLogging) return;
    logTimer?.cancel();
    setState(() {
      isLogging = false;
    });
    // If the maximum TPS in this session never went above 70, show a popup.
    if (maxTpsDuringLog < 70) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text("Insufficient Throttle"),
          content: Text("Go to the nearest race track and go wide open throttle!"),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("OK"),
            )
          ],
        ),
      );
    }
    CsvLogger csvLogger = CsvLogger(currentLogPoints, context);
    String csvContent = csvLogger.generateCsv();
    final provider = Provider.of<JB4BleProvider>(context, listen: false);
    String fileName = await _generateLogFileName(provider);
    File file = File("${logDir!.path}/$fileName");
    await file.writeAsString(csvContent);
    await _refreshLogFiles();
  }

  Future<void> emailLog(File file) async {
    final Email email = Email(
      body: 'Please find attached the JB4 log file.',
      subject: 'JB4 Log File: ${file.uri.pathSegments.last}',
      // Optionally set recipients here, e.g.:
      // recipients: ['example@example.com'],
      attachmentPaths: [file.path],
      isHTML: false,
    );
    try {
      await FlutterEmailSender.send(email);
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error sending email: $error")));
    }
  }

  Future<void> _deleteSelectedLogs() async {
    for (var path in selectedLogPaths) {
      File file = File(path);
      if (await file.exists()) {
        await file.delete();
      }
    }
    selectedLogPaths.clear();
    await _refreshLogFiles();
  }

  Future<void> _deleteAllLogs() async {
    bool confirm = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text("Delete All Logs"),
            content: Text("Are you sure you want to delete all log files?"),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text("Cancel"),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text("Delete All"),
              ),
            ],
          ),
        ) ??
        false;
    if (confirm) {
      if (logDir != null) {
        for (var file in logDir!.listSync()) {
          if (file.path.endsWith('.csv')) {
            await File(file.path).delete();
          }
        }
      }
      selectedLogPaths.clear();
      await _refreshLogFiles();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<JB4BleProvider>(
      builder: (context, provider, child) {
        checkThrottleAndControlLogging(provider);
        return Scaffold(
          appBar: AppBar(
            title: Text("JB4 Logging"),
            actions: [
              // Add a toggle for boost sample mode
              IconButton(
                icon: Icon(boostSampleEnabled ? Icons.speed : Icons.speed_outlined),
                tooltip: "Toggle Boost Sample Mode",
                onPressed: () {
                  setState(() {
                    boostSampleEnabled = !boostSampleEnabled;
                  });
                },
              ),
              IconButton(
                icon: Icon(Icons.delete),
                onPressed: selectedLogPaths.isNotEmpty
                    ? () async {
                        bool confirm = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: Text("Delete Selected Logs"),
                                content: Text("Are you sure you want to delete the selected log files?"),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context, false),
                                    child: Text("Cancel"),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.pop(context, true),
                                    child: Text("Delete"),
                                  ),
                                ],
                              ),
                            ) ??
                            false;
                        if (confirm) {
                          await _deleteSelectedLogs();
                        }
                      }
                    : null,
                onLongPress: () async {
                  if (selectedLogPaths.isEmpty) {
                    await _deleteAllLogs();
                  }
                },
              ),
            ],
          ),
          body: Column(
            children: [
              Expanded(
                flex: 1,
                child: isLogging
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Logging in progress...",
                              style: TextStyle(fontSize: 18),
                            ),
                            SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: stopLogging,
                              child: Text("Stop Logging"),
                            ),
                          ],
                        ),
                      )
                    : Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: ElevatedButton(
                              onPressed: startLogging,
                              child: Text("Start Logging"),
                            ),
                          ),
                          Expanded(
                            child: logFiles.isEmpty
                                ? Center(child: Text("No logs found"))
                                : ListView.builder(
                                    itemCount: logFiles.length,
                                    itemBuilder: (context, index) {
                                      final file = logFiles[index];
                                      final fileName = file.uri.pathSegments.last;
                                      final isSelected = selectedLogPaths.contains(file.path);
                                      return ListTile(
                                        title: Text(fileName),
                                        selected: isSelected,
                                        selectedTileColor: Colors.blue.withOpacity(0.1),
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) => LogGraphScreen(file: File(file.path)),
                                            ),
                                          );
                                        },
                                        onLongPress: () {
                                          setState(() {
                                            if (isSelected) {
                                              selectedLogPaths.remove(file.path);
                                            } else {
                                              selectedLogPaths.add(file.path);
                                            }
                                          });
                                        },
                                        trailing: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: Icon(Icons.email),
                                              onPressed: () => emailLog(File(file.path)),
                                            ),
                                            Checkbox(
                                              value: isSelected,
                                              onChanged: (value) {
                                                setState(() {
                                                  if (value == true) {
                                                    selectedLogPaths.add(file.path);
                                                  } else {
                                                    selectedLogPaths.remove(file.path);
                                                  }
                                                });
                                              },
                                            ),
                                          ],
                                        ),
                                      );
                                    },
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
}

/// LogGraphScreen displays a graph of the log data from a CSV file using syncfusion_flutter_charts.
class LogGraphScreen extends StatefulWidget {
  final File file;
  const LogGraphScreen({Key? key, required this.file}) : super(key: key);

  @override
  _LogGraphScreenState createState() => _LogGraphScreenState();
}

class _LogGraphScreenState extends State<LogGraphScreen> {
  List<GraphData> dataPoints = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _parseCsv();
  }

  Future<void> _parseCsv() async {
    String content = await widget.file.readAsString();
    List<String> lines = LineSplitter.split(content).toList();
    // Skip the first five header lines (now we have 5 header rows instead of 3).
    if (lines.length > 5) {
      for (int i = 5; i < lines.length; i++) {
        List<String> parts = lines[i].split(",");
        if (parts.length >= 2) {
          double? time = double.tryParse(parts[0]);
          int? rpm = int.tryParse(parts[1]);
          if (time != null && rpm != null) {
            dataPoints.add(GraphData(time, rpm));
          }
        }
      }
    }
    setState(() {
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Log Graph - ${widget.file.uri.pathSegments.last}"),
      ),
      body: loading
          ? Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: SfCartesianChart(
                primaryXAxis: NumericAxis(
                  edgeLabelPlacement: EdgeLabelPlacement.shift,
                  title: AxisTitle(text: 'Time (s)'),
                ),
                primaryYAxis: NumericAxis(
                  title: AxisTitle(text: 'RPM'),
                ),
                tooltipBehavior: TooltipBehavior(enable: true),
                series: <CartesianSeries>[
                  LineSeries<GraphData, num>(
                    dataSource: dataPoints,
                    xValueMapper: (GraphData gd, _) => gd.time,
                    yValueMapper: (GraphData gd, _) => gd.rpm,
                    markerSettings: MarkerSettings(isVisible: true),
                  )
                ],
              ),
            ),
    );
  }
}
