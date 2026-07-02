// lib/providers/ble_provider.dart
//
// This file contains the full updated JB4BleProvider class.
// It handles BLE scanning, connection, notification parsing, ASCII commands, firmware update support,
// and exposes all gauge and extra fields as variables for use throughout your application.
// No functionality has been removed or broken.

import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:collection';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';

/// JB4BleProvider handles:
///  - Scanning/connecting to the BLE device (named "JB4PRO"),
///  - Subscribing to notifications,
///  - Sending ASCII commands (e.g. "A" to start logging, "B" to pause, "$#CJ" to retrieve settings),
///  - Parsing incoming ASCII data to update gauge fields and extended sensor settings,
///  - Firmware update commands (byte‑based), including bootloader entry, erase, flash, verify, exit,
///  - Exposing all gauge and extra fields as variables or getters.
class JB4BleProvider with ChangeNotifier {
  // BLE Setup
  final FlutterReactiveBle _ble = FlutterReactiveBle();

  // Device name and UUIDs must match your device.
  static const String _deviceName = "JB4PRO";
  final Uuid _serviceUuid = Uuid.parse("0000FFE0-0000-1000-8000-00805F9B34FB");
  final Uuid _writeUuid = Uuid.parse("0000FFE9-0000-1000-8000-00805F9B34FB");
  final Uuid _notifyUuid = Uuid.parse("0000FFE4-0000-1000-8000-00805F9B34FB");

  // Discovered device instance.
  DiscoveredDevice? _device;

  // Qualified characteristics for write and notify.
  QualifiedCharacteristic? _writeCharacteristic;
  QualifiedCharacteristic? _notifyCharacteristic;

  // Subscriptions.
  StreamSubscription<DiscoveredDevice>? _scanSubscription;
  StreamSubscription<ConnectionStateUpdate>? _connectionSubscription;
  StreamSubscription<List<int>>? _notifySubscription;

  // Connection status and error messages.
  String _status = "Disconnected";
  String get status => _status;
  String _errorMessage = "";
  String get errorMessage => _errorMessage;
  
  // Connection health check
  Timer? _connectionHealthTimer;
  DateTime _lastNotificationTime = DateTime.now();
  bool _isReconnecting = false;

  void _setStatus(String newStatus) {
    _status = newStatus;
    notifyListeners();
    
    // Start health check timer when connected
    if (newStatus == "Connected") {
      _startConnectionHealthCheck();
    } else if (newStatus == "Disconnected") {
      _stopConnectionHealthCheck();
    }
  }

  void _setError(String msg) {
    _errorMessage = msg;
    addLog("ERROR: $msg");
    notifyListeners();
  }
  
  /// Starts a timer to check connection health
  void _startConnectionHealthCheck() {
    _stopConnectionHealthCheck(); // Stop any existing timer
    
    _lastNotificationTime = DateTime.now();
    _connectionHealthTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      // Check if we've received notifications recently
      final timeSinceLastNotification = DateTime.now().difference(_lastNotificationTime);
      
      if (timeSinceLastNotification.inSeconds > 30 && !_isReconnecting) {
        addLog("WARNING: No notifications received in ${timeSinceLastNotification.inSeconds} seconds");
        
        // If no notifications for 30 seconds, try to restart logging
        if (_status == "Connected") {
          addLog("Attempting to restart logging due to inactivity");
          _restartLogging();
        }
        
        // If no notifications for 60 seconds, try to reconnect
        if (timeSinceLastNotification.inSeconds > 60 && !_isReconnecting) {
          addLog("No notifications for over 60 seconds, attempting to reconnect");
          _attemptReconnection();
        }
      }
    });
  }
  
  /// Stops the connection health check timer
  void _stopConnectionHealthCheck() {
    _connectionHealthTimer?.cancel();
    _connectionHealthTimer = null;
  }
  
  /// Attempts to restart logging to resume notifications
  Future<void> _restartLogging() async {
    try {
      // Stop and restart logging to refresh the connection
      await stopLogging();
      await Future.delayed(const Duration(milliseconds: 500));
      await startLogging();
      addLog("Logging restarted successfully");
    } catch (e) {
      addLog("Error restarting logging: $e");
    }
  }
  
  /// Attempts to reconnect to the device
  Future<void> _attemptReconnection() async {
    if (_isReconnecting || _device == null) return;
    
    _isReconnecting = true;
    addLog("Attempting to reconnect to device");
    
    try {
      // Disconnect first
      await disconnect();
      await Future.delayed(const Duration(seconds: 1));
      
      // Then reconnect
      await scanAndConnect();
      
      _isReconnecting = false;
      addLog("Reconnection attempt completed");
    } catch (e) {
      _isReconnecting = false;
      addLog("Error during reconnection attempt: $e");
    }
  }

  // A simple list of log messages for debugging.
  final List<String> _logMessages = [];
  List<String> get logMessages => List.unmodifiable(_logMessages);
  void addLog(String message) {
    final ts = DateTime.now().toIso8601String();
    _logMessages.add("[$ts] $message");
    if (_logMessages.length > 5000) {
      _logMessages.removeAt(0);
    }
    Future.delayed(Duration.zero, () {
      notifyListeners();
    });
  }

  void addLogMessage(String message) => addLog(message);
  void setErrorMessage(String message) => _setError(message);
  void clearLogs() {
    _logMessages.clear();
    notifyListeners();
  }

  // --------------------------------------------------------------------------
  // ASCII Parsing Fields (as per C protocol)
  // --------------------------------------------------------------------------
  String rpm = "0"; // from 'A'
  String boost = "0.0"; // from 'B'
  String boost2 = "0.0"; // from 'j'
  String tps = "0"; // from 'C'
  String mapSelection = ""; // from 'F'
  String iat = ""; // from 'G'
  String waterTemp = ""; // from '<'
  String oilTemp = ""; // from '>'
  String e85 = ""; // from 'f'
  String transTemp = ""; // from 'e'
  String clockValue = ""; // from 'H'
  String pwm = ""; // from 'D'
  String fuel = ""; // from 'E'
  String egt = ""; // from '&'
  String trims2 = ""; // from 'k'
  String gear = ""; // from '!'
  String speed = ""; // from 'l'
  String afr = ""; // from '^'
  String meth = ""; // from '%'
  String oilTempAlt = ""; // from '$'
  String ffPid = ""; // from '-'
  String afr2 = ""; // from ':'
  bool bootloaderError = false; // from 'Y'
  String ambientVoltage = ""; // from 'L'
  String dmeBoost = "0.0"; // from 'M'
  String ignitionAdv = "0.0"; // from ')'
  String avgIgn = "0.0"; // from '('
  String avgIgnDrop = "0.0"; // from 'z'
  String dmeBt = "0.0"; // from '*'
  String dmeTarget = "0.0"; // from 'N'
  String vin = ""; // from 'Z'

  // 48-byte block fields (extended sensor packet/calibration values).
  String rpm1500 = "";
  String rpm2000 = "";
  String rpm2500 = "";
  String rpm3000 = "";
  String rpm3500 = "";
  String rpm4000 = "";
  String rpm4500 = "";
  String rpm5000 = "";
  String rpm5500 = "";
  String rpm6000 = "";
  String rpm6500 = "";
  String rpm7000 = "";
  String tmapSensor = ""; // TMAP 3.5bar value from byte 25
  String boostLimit3rd = "";
  String fuel2500 = "";
  String fuel3000 = "";
  String fuel3500 = "";
  String fuel4000 = "";
  String fuel4500 = "";
  String fuel5000 = "";
  String fuel5500 = "";
  String fuel6000 = "";
  String fuel6500 = "";
  String sixCylTiming = "";
  String cps1500 = "";
  String cps2000 = "";
  String cps2500 = "";
  String cps3000 = "";
  String cps3500 = "";
  String cps4000 = "";
  String cps4500 = "";
  String cps5000 = "";
  String cps5500 = "";
  String cps6000 = "";
  String cps6500 = "";
  String cps7000 = "";

  // Additional advanced and configuration fields.
  String futureUseA = "";
  String m1PidGain = "";
  String m1Throttle = "";
  String m1LagFix = "";
  String m1BoostLimit = "";
  String feedForward = "";
  String boostLimit1st = "";
  String boostLimit2nd = "";
  String m1MethHard = "";
  String methRange = "";
  String methTrigger = "";
  int fudBits = 0;
  
  // Ethanol setup state
  int _ethanolSetup = 0;
  bool _scalePiOnFlexFuel = false;
  bool _startupE85Indicator = false;
  bool _blockedInUSA = false;
  bool _enableWmiPumpPwm = false;
  
  // Ethanol setup getters
  int get ethanolSetup => _ethanolSetup;
  bool get scalePiOnFlexFuel => _scalePiOnFlexFuel;
  bool get startupE85Indicator => _startupE85Indicator;
  bool get blockedInUSA => _blockedInUSA;
  bool get enableWmiPumpPwm => _enableWmiPumpPwm;
  
  // Ethanol setup setters
  void setEthanolSetup(int value) {
    _ethanolSetup = value;
    notifyListeners();
  }
  
  void setScalePiOnFlexFuel(bool value) {
    _scalePiOnFlexFuel = value;
    notifyListeners();
  }
  
  void setStartupE85Indicator(bool value) {
    _startupE85Indicator = value;
    notifyListeners();
  }
  
  void setBlockedInUSA(bool value) {
    _blockedInUSA = value;
    notifyListeners();
  }
  
  void setEnableWmiPumpPwm(bool value) {
    _enableWmiPumpPwm = value;
    notifyListeners();
  }
  String fuelPressure = "";
  String jb4Firmware = ""; // Full firmware version (e.g. "158/28/1")
  String interfaceVer = "1/1/25"; // Interface version
  String country = "United States"; // Country
  String learnedIgn = "0"; // Learned ignition
  int platform = 0;
  int boardType = 0;
  String n1MinPsi = "";
  String n1Enabled = "";
  int e85Bits = 0;
  String n1MinRpm = "";
  String n1MaxRpm = "";
  String n1RampRate = "";
  String virtualFfOffset = "";
  String openLoop = "";
  String methSafety = "";
  String cpsValue = "";
  String lastSafety = "";
  String accel = "";
  String n1MinGear = "";
  String n1MinAfr = "";
  String n1MinAdvance = "";
  String kr1 = "";
  String kr2 = "";
  String kr3 = "";
  String kr4 = "";
  String kr5 = "";
  String kr6 = "";
  String kr7 = "";
  String kr8 = "";
  String aux1 = "";
  String aux2 = "";
  String aux3 = "";
  String aux4 = "";
  String aux5 = "";
  String aux6 = "";
  String maf1 = "";
  String maf2 = "";

  // A buffer to accumulate incoming ASCII data.
  String _asciiBuffer = "";

  // Flag indicating whether logging is active.
  bool loggingActive = false;

  // For clock ('H') calculations.
  int _lastClockRaw = 0;

  // Flags for settings load.
  bool _settingsLoaded = false;
  bool _loadingSettings = false;
  bool get isLoadingSettings => _loadingSettings;

  // --------------------------------------------------------------------------
  // Firmware Update Support Fields & Methods
  // --------------------------------------------------------------------------
  Completer<bool>? _commandCompleter;
  int _expectedResponseCode = 0;
  final Queue<Function> _commandQueue = Queue<Function>();
  bool _isProcessingQueue = false;
  bool _firmwareUpdateMode = false; // When true, skip ASCII parsing if needed.

  /// Enable or disable firmware update mode.
  void setFirmwareUpdateMode(bool enable) {
    _firmwareUpdateMode = enable;
    addLog("Firmware update mode set to: $_firmwareUpdateMode");
  }

  /// Sends a command without waiting for a response.
  Future<bool> sendCommandWithoutResponsePublic(List<int> command) async {
    if (_writeCharacteristic == null) {
      _setError("Write characteristic not ready");
      return false;
    }
    try {
      // Log raw bytes being sent
      StringBuffer rawHex = StringBuffer('[TX] ');
      for (var byte in command) {
        rawHex.write('${byte.toRadixString(16).padLeft(2, '0').toUpperCase()} ');
      }
      addLog(rawHex.toString());

      // Log packet type based on first byte
      if (command.isNotEmpty) {
        switch (command[0]) {
          case 0x54: // 'T'
            addLog("WMI Settings Packet (26 bytes):");
            for (int i = 0; i < command.length; i++) {
              addLog("Byte $i: 0x${command[i].toRadixString(16).padLeft(2, '0').toUpperCase()} " +
                    _getWmiByteDescription(i, command[i]));
            }
            break;
          case 0x52: // 'R'
            addLog("MAP1 Settings Packet (64 bytes):");
            for (int i = 0; i < command.length; i++) {
              addLog("Byte $i: 0x${command[i].toRadixString(16).padLeft(2, '0').toUpperCase()} " +
                    _getMap1ByteDescription(i, command[i]));
            }
            break;
          case 0x61: // 'a'
            addLog("Extended Sensor Packet (48 bytes):");
            for (int i = 0; i < command.length; i++) {
              addLog("Byte $i: 0x${command[i].toRadixString(16).padLeft(2, '0').toUpperCase()} " +
                    _getExtendedSensorByteDescription(i, command[i]));
            }
            break;
        }
      }

      await _ble.writeCharacteristicWithoutResponse(_writeCharacteristic!, value: command);
      return true;
    } catch (e) {
      _setError("Error sending command without response: $e");
      return false;
    }
  }

  String _getWmiByteDescription(int index, int value) {
    String desc = "";
    switch (index) {
      case 0: 
        desc = "(Header 'T')";
        break;
      case 1:
      case 2:
        int boostAdd = (index == 1) ? value << 8 : value;
        desc = "(Boost Additive ${index == 1 ? 'High' : 'Low'} - Target: ${boostAdd / 10.0} PSI)";
        break;
      case 3:
      case 4:
        int signalScale = (index == 3) ? value << 8 : value;
        desc = "(Signal Scaling ${index == 3 ? 'High' : 'Low'} - Range: 0-100%)";
        break;
      case 5:
      case 6:
        int minFlow = (index == 5) ? value << 8 : value;
        desc = "(Min Flow Boost ${index == 5 ? 'High' : 'Low'} - Threshold: ${minFlow / 10.0} PSI)";
        break;
      case 7:
      case 8:
        int enabled = (index == 7) ? value << 8 : value;
        desc = "(External Output ${index == 7 ? 'High' : 'Low'} - Value: $enabled)";
        break;
      case 9:
      case 10:
        int minRpm = (index == 9) ? value << 8 : value;
        desc = "(Min RPM ${index == 9 ? 'High' : 'Low'} - Threshold: $minRpm RPM)";
        break;
      case 11:
      case 12:
        int maxRpm = (index == 11) ? value << 8 : value;
        desc = "(Max RPM ${index == 11 ? 'High' : 'Low'} - Threshold: $maxRpm RPM)";
        break;
      case 13:
      case 14:
        int vOffset = (index == 13) ? value << 8 : value;
        desc = "(Virtual Sensor Offset ${index == 13 ? 'High' : 'Low'} - Value: $vOffset)";
        break;
      case 15:
      case 16:
        int minTps = (index == 15) ? value << 8 : value;
        desc = "(Min TPS ${index == 15 ? 'High' : 'Low'} - Threshold: $minTps%)";
        break;
      case 17:
      case 18:
        int minGear = (index == 17) ? value << 8 : value;
        desc = "(Min Gear ${index == 17 ? 'High' : 'Low'} - Value: $minGear)";
        break;
      case 19:
      case 20:
        int minAfr = (index == 19) ? value << 8 : value;
        desc = "(Min AFR ${index == 19 ? 'High' : 'Low'} - Target: ${minAfr / 10.0})";
        break;
      case 21:
      case 22:
        int minAdv = (index == 21) ? value << 8 : value;
        desc = "(Min Advance ${index == 21 ? 'High' : 'Low'} - Value: ${minAdv / 10.0}°)";
        break;
      case 23:
      case 24:
        int ethanolBits = (index == 23) ? value << 8 : value;
        if (index == 23) {
          desc = "(Ethanol Setup High - Raw: 0x${value.toRadixString(16).padLeft(2, '0')})";
        } else {
          StringBuffer bits = StringBuffer("(Ethanol Setup Low - Bits: ");
          bits.write(value & 0x0F > 0 ? "FlexFuel Input ${value & 0x0F}, " : "");
          bits.write((value & 0x10) != 0 ? "Scale PI, " : "");
          bits.write((value & 0x20) != 0 ? "E85 Indicator, " : "");
          bits.write((value & 0x40) != 0 ? "Blocked USA, " : "");
          bits.write((value & 0x80) != 0 ? "WMI Pump PWM" : "");
          bits.write(")");
          desc = bits.toString();
        }
        break;
      case 25:
        desc = "(End Marker '\$')";
        break;
      default:
        desc = "";
    }
    return desc;
  }

  String _getMap1ByteDescription(int index, int value) {
    String desc = "";
    if (index == 0) {
      desc = "(Header 'R')";
    } else if (index == 63) {
      desc = "(End Marker '#')";
    } else if (index == 62) {
      desc = "(Checksum: 0x${value.toRadixString(16).padLeft(2, '0')})";
    } else if (index >= 1 && index <= 24) {
      // RPM/Boost Settings come in pairs
      if (index % 2 == 0) {
        int rpm = 1500 + (index ~/ 2) * 500;
        desc = "(RPM $rpm Low - Target: $value PSI)";
      } else {
        int rpm = 1500 + ((index - 1) ~/ 2) * 500;
        desc = "(RPM $rpm High - Target: ${value << 8} PSI)";
      }
    } else if (index >= 25 && index <= 39) {
      // Advanced Settings
      switch (index) {
        case 25: desc = "(Boost Safety: $value PSI)"; break;
        case 26: desc = "(Feed Forward: $value)"; break;
        case 27: desc = "(Meth Trigger: $value%)"; break;
        case 28: desc = "(Boost Limit 1st: $value PSI)"; break;
        case 29: desc = "(Future Use A: $value)"; break;
        case 30: desc = "(M1 Lag Fix: $value)"; break;
        case 31: 
          StringBuffer bits = StringBuffer("(FUD Bits: ");
          bits.write((value & 0x01) != 0 ? "WheelCtrl " : "");
          bits.write((value & 0x02) != 0 ? "WGAdapt " : "");
          bits.write((value & 0x04) != 0 ? "ColdStart " : "");
          bits.write((value & 0x08) != 0 ? "TipIn " : "");
          bits.write((value & 0x10) != 0 ? "Inactive " : "");
          bits.write((value & 0x20) != 0 ? "AntilagBrake " : "");
          bits.write((value & 0x40) != 0 ? "O2Press " : "");
          bits.write((value & 0x80) != 0 ? "O2Reset" : "");
          bits.write(")");
          desc = bits.toString();
          break;
        case 32: desc = "(PID Gain: $value)"; break;
        case 33: desc = "(Open Loop: $value)"; break;
        case 34: desc = "(M1 Throttle: $value)"; break;
        case 35: desc = "(Boost Limit 2nd: $value PSI)"; break;
        case 36: desc = "(Meth Safety: $value)"; break;
        case 37: desc = "(TMAP Sensor: $value)"; break;
        case 38: desc = "(Boost Limit 3rd: $value PSI)"; break;
        case 39: desc = "(Reserved: $value)"; break;
      }
    } else if (index >= 40 && index <= 48) {
      int rpm = 2500 + ((index - 40) * 500);
      desc = "(Fuel $rpm: $value%)";
    } else if (index == 49) {
      desc = "(Six-Cylinder Timing: $value°)";
    } else if (index >= 50 && index <= 61) {
      int rpm = 1500 + ((index - 50) * 500);
      desc = "(CPS $rpm: $value%)";
    }
    return desc;
  }

  String _getExtendedSensorByteDescription(int index, int value) {
    String desc = "";
    if (index >= 0 && index <= 23) {
      final rpm = 1500 + (index ~/ 2) * 500;
      if (index % 2 == 0) {
        desc = "(RPM $rpm Low - Raw: 0x${value.toRadixString(16).padLeft(2, '0')})";
      } else {
        // Calculate actual PSI value from low/high bytes
        int lowByte = _asciiBuffer.codeUnitAt(index - 1);
        int highByte = value;
        int psi = ((highByte << 8) | lowByte) ~/ 10;
        desc = "(RPM $rpm High - Target: $psi PSI)";
      }
    } else if (index == 25) {
      desc = "(TMAP Sensor: ${value}bar)";
    } else if (index == 26) {
      desc = "(Boost Limit 3rd: $value PSI)";
    } else if (index >= 26 && index <= 34) {
      final rpm = 2500 + ((index - 26) * 500);
      desc = "(Fuel $rpm: $value%)";
    } else if (index == 35) {
      desc = "(Six-Cylinder Timing: $value°)";
    } else if (index >= 36 && index <= 47) {
      final rpm = 1500 + ((index - 36) * 500);
      desc = "(CPS $rpm: $value% Duty)";
    }
    return desc;
  }

  /// Internal method: sends a command and waits for the expected response code.
  Future<bool> _sendCommandAndWaitForResponse(
    List<int> command, {
    required int expectedResponseCode,
    int retries = 0,
  }) async {
    if (_writeCharacteristic == null) {
      _setError("Write characteristic is not initialized.");
      return false;
    }
    if (_commandCompleter != null && !_commandCompleter!.isCompleted) {
      _setError("Another command is being processed. Please wait.");
      return false;
    }
    _commandCompleter = Completer<bool>();
    _expectedResponseCode = expectedResponseCode;
    try {
      await _ble.writeCharacteristicWithoutResponse(_writeCharacteristic!, value: command);
      addLog("Sent command ${command[0]}: $command");
      bool success = await _commandCompleter!.future.timeout(
        const Duration(seconds: 2),
        onTimeout: () {
          addLog("Timeout waiting for command ${command[0]}");
          return false;
        },
      );
      if (!success && retries < 3) {
        addLog("Retrying command ${command[0]}, attempt ${retries + 1}");
        await Future.delayed(const Duration(milliseconds: 200));
        return _sendCommandAndWaitForResponse(
          command,
          expectedResponseCode: expectedResponseCode,
          retries: retries + 1,
        );
      }
      return success;
    } catch (e) {
      _setError("Error sending command ${command[0]}: $e");
      return false;
    } finally {
      _commandCompleter = null;
    }
  }

  /// Public wrapper: sends bytes and waits for expected response.
  Future<bool> sendCommandAndWaitForResponsePublic(
    List<int> command, {
    required int expectedResponseCode,
    int retries = 0,
  }) async {
    return await _sendCommandAndWaitForResponse(
      command,
      expectedResponseCode: expectedResponseCode,
      retries: retries,
    );
  }

  /// Sends a command and waits for a string‑based notification as the response.
  Future<String?> readStringResponse(
    String tag, {
    required List<int> command,
    required Duration timeout,
  }) async {
    if (_writeCharacteristic == null) {
      _setError("Write characteristic not initialized.");
      return null;
    }
    final completer = Completer<String?>();
    int expectedResponseCode = command.isNotEmpty ? command[0] : 0;
    try {
      if (command.isNotEmpty) {
        await _ble.writeCharacteristicWithoutResponse(_writeCharacteristic!, value: command);
        addLog("Sent command for readStringResponse: $command");
      }
      StreamSubscription<List<int>>? tempSubscription;
      tempSubscription = _ble.subscribeToCharacteristic(_notifyCharacteristic!).listen((data) {
        if (data.isNotEmpty) {
          String response = String.fromCharCodes(data);
          addLog("Received string response for tag '$tag': $response");
          completer.complete(response);
          tempSubscription?.cancel();
        }
      }, onError: (error) {
        addLog("Error in readStringResponse for tag '$tag': $error");
        tempSubscription?.cancel();
        completer.completeError(error);
      });
      return completer.future.timeout(timeout, onTimeout: () {
        tempSubscription?.cancel();
        addLog("Timeout waiting for readStringResponse for command $expectedResponseCode");
        return null;
      });
    } catch (e) {
      _setError("Error in readStringResponse: $e");
      return null;
    }
  }

  /// Enqueues a command to ensure sequential processing.
  Future<T> _enqueueCommand<T>(Future<T> Function() command) async {
    final completer = Completer<T>();
    _commandQueue.add(() async {
      try {
        T result = await command();
        completer.complete(result);
      } catch (e) {
        completer.completeError(e);
      }
    });
    if (!_isProcessingQueue) {
      _processQueue();
    }
    return completer.future;
  }

  /// Processes the command queue.
  void _processQueue() async {
    _isProcessingQueue = true;
    while (_commandQueue.isNotEmpty) {
      final command = _commandQueue.removeFirst();
      await command();
      await Future.delayed(const Duration(milliseconds: 600));
    }
    _isProcessingQueue = false;
  }

  // --------------------------------------------------------------------------
  // ASCII Logging & Commands
  // --------------------------------------------------------------------------
  /// Sends an ASCII command (e.g. "A" to start logging, "B" to stop logging).
  Future<void> sendAsciiCommand(String cmd) async {
    if (_writeCharacteristic == null) {
      _setError("Write characteristic not ready");
      return;
    }
    try {
      addLog("Sending ASCII command: '$cmd'");
      final data = utf8.encode(cmd);
      await _ble.writeCharacteristicWithoutResponse(_writeCharacteristic!, value: data);
      addLog("Successfully sent ASCII command: '$cmd'");
    } catch (e) {
      _setError("Send cmd '$cmd' failed: $e");
    }
  }
  
  /// Sends a single byte with a delay, matching the original application's SERoutBYTES method.
  Future<void> sendSingleByte(int byte) async {
    if (_writeCharacteristic == null) {
      _setError("Write characteristic not ready");
      return;
    }
    try {
      final data = [byte];
      await _ble.writeCharacteristicWithoutResponse(_writeCharacteristic!, value: data);
      // No logging for individual bytes to avoid log spam
    } catch (e) {
      _setError("Send byte 0x${byte.toRadixString(16).padLeft(2, '0')} failed: $e");
    }
  }

  /// Called by the gauge screen to start logging.
  Future<void> startLogging() async {
    addLog("Starting logging (sending 'A' command) for gauge update.");
    await sendAsciiCommand("A");
    loggingActive = true;
    // Use post-frame callback to ensure notification happens after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifyListeners();
    });
  }

  /// Called by the gauge screen to stop logging.
  Future<void> stopLogging() async {
    addLog("Stopping logging (sending 'B' command).");
    await sendAsciiCommand("B");
    loggingActive = false;
    notifyListeners();
  }
  
  /// Prepares the device for settings save by stopping logging and clearing buffers
  Future<void> prepareForSettingsSave() async {
    addLog("Preparing for settings save...");
    
    // Send pause command twice
    await sendAsciiCommand("B");
    await Future.delayed(Duration(milliseconds: 25));
    await sendAsciiCommand("B");
    await Future.delayed(Duration(milliseconds: 25));
    addLog("Sent pause commands");
    
    // Clear buffer
    clearAsciiBuffer();
    await Future.delayed(Duration(milliseconds: 100));
    
    addLog("Device prepared for settings save");
  }

  /// Fetch settings from JB4.
  /// Sends only necessary commands to get settings.
  Future<void> fetchSettings() async {
    addLog("Fetching settings...");
    
    // Set flags before starting
    _loadingSettings = true;
    _settingsLoaded = false;
    
    // Send pause command twice
    await sendAsciiCommand("B");
    await Future.delayed(Duration(milliseconds: 25));
    await sendAsciiCommand("B");
    await Future.delayed(Duration(milliseconds: 25));
    addLog("Sent pause commands");
    
    // Clear buffer before requesting settings
    clearAsciiBuffer();
    addLog("Cleared ASCII buffer");
    await Future.delayed(const Duration(milliseconds: 100));
    
    // Send settings request commands as a single command
    await sendAsciiCommand("\$#CJ");
    addLog("Sent settings request command");
    
    // Wait for settings to be processed
    await Future.delayed(Duration(milliseconds: 500));
    
    // Send WMI settings request
    await sendAsciiCommand("T");
    addLog("Sent WMI settings request");
    
    // Wait for WMI settings
    await Future.delayed(Duration(milliseconds: 500));
    
    // Resume logging
    await sendAsciiCommand("A");
    addLog("Resumed logging");
  }

  // --------------------------------------------------------------------------
  // Notification Handler and ASCII Parser
  // --------------------------------------------------------------------------
  /// Handles incoming BLE notifications.
  void _handleNotification(List<int> data) {
    if (data.isEmpty) return;
    
    // Update last notification time for connection health check
    _lastNotificationTime = DateTime.now();

    // Log raw received bytes
    StringBuffer rawHex = StringBuffer('[RX] ');
    for (var byte in data) {
      rawHex.write('${byte.toRadixString(16).padLeft(2, '0').toUpperCase()} ');
    }
    addLog(rawHex.toString());

    // Special handling for VIN data which comes in a 13-byte packet (Z + 12 bytes)
    if (data.length == 13 && data[0] == 0x5A) { // 0x5A = 'Z'
      List<int> vinBytes = [];
      for (int i = 1; i < 13; i++) {
        // Convert 0x00 or 0xFF to space (0x20) as per C# implementation
        if (data[i] == 0x00 || data[i] == 0xFF) {
          vinBytes.add(0x20); // ASCII space
        } else {
          vinBytes.add(data[i]);
        }
      }
      String vinStr = String.fromCharCodes(vinBytes).trim();
      if (vinStr.isNotEmpty) {
        vin = vinStr;
        addLog("Received VIN data: [${vinBytes.map((b) => '0x${b.toRadixString(16).padLeft(2, '0').toUpperCase()}').join(' ')}]");
        addLog("Processed VIN: '$vin'");
        notifyListeners();
      }
      return;
    }

    // Log packet type based on first byte for non-VIN data
    if (data.isNotEmpty) {
      switch (data[0]) {
        case 0x54: // 'T'
          addLog("Received WMI Settings Response:");
          for (int i = 0; i < data.length; i++) {
            addLog("Byte $i: 0x${data[i].toRadixString(16).padLeft(2, '0').toUpperCase()} " +
                  _getWmiByteDescription(i, data[i]));
          }
          // Process WMI settings packet
          _parseWmiSettingsPacket(data);
          break;
        case 0x52: // 'R'
          addLog("Received MAP1 Settings Response:");
          for (int i = 0; i < data.length; i++) {
            addLog("Byte $i: 0x${data[i].toRadixString(16).padLeft(2, '0').toUpperCase()} " +
                  _getMap1ByteDescription(i, data[i]));
          }
          break;
        case 0x61: // 'a'
          addLog("Received Extended Sensor Response:");
          for (int i = 0; i < data.length; i++) {
            addLog("Byte $i: 0x${data[i].toRadixString(16).padLeft(2, '0').toUpperCase()} " +
                  _getExtendedSensorByteDescription(i, data[i]));
          }
          break;
      }
    }

    if (_commandCompleter != null &&
        data.isNotEmpty &&
        data[0] == _expectedResponseCode) {
      _parseData(data[0], data);
      _commandCompleter?.complete(true);
      _commandCompleter = null;
      return;
    }
    
    _onNotifyData(data);
  }

  /// Parses firmware update command responses
  void _parseData(int command, List<int> data) {
    StringBuffer hexLog = StringBuffer();
    hexLog.write("Firmware Command 0x${command.toRadixString(16).padLeft(2, '0').toUpperCase()} ");
    
    switch (command) {
      case 0x55: // 'U'
        addLog("Firmware Update Packet - Enter Bootloader");
        break;
      case 0x45: // 'E'
        addLog("Firmware Update Packet - Erase Flash");
        break;
      case 0x46: // 'F'
        addLog("Firmware Update Packet - Flash Data");
        break;
      case 0x56: // 'V'
        addLog("Firmware Update Packet - Verify Flash");
        break;
      case 0x58: // 'X'
        addLog("Firmware Update Packet - Exit Bootloader");
        break;
    }

    // Log bytes
    for (int i = 0; i < data.length; i++) {
      hexLog.write('${data[i].toRadixString(16).padLeft(2, '0').toUpperCase()} ');
      addLog("Byte $i: 0x${data[i].toRadixString(16).padLeft(2, '0').toUpperCase()} " +
             _getFirmwareByteDescription(command, i, data[i]));
    }
    addLog(hexLog.toString());
  }

  String _getFirmwareByteDescription(int command, int index, int value) {
    if (index == 0) {
      switch (command) {
        case 0x55: return "(Enter Bootloader Command)";
        case 0x45: return "(Erase Flash Command)";
        case 0x46: return "(Flash Data Command)";
        case 0x56: return "(Verify Flash Command)";
        case 0x58: return "(Exit Bootloader Command)";
      }
    }
    
    switch (command) {
      case 0x46: // Flash Data
        if (index == 1) return "(Address High)";
        if (index == 2) return "(Address Low)";
        if (index >= 3) return "(Flash Data Byte)";
        break;
      case 0x56: // Verify
        if (index == 1) return "(Address High)";
        if (index == 2) return "(Address Low)";
        if (index >= 3) return "(Verify Data Byte)";
        break;
    }
    return "";
  }

  /// Called when a BLE notification arrives; converts and appends ASCII data.
  void _onNotifyData(List<int> rawData) {
    if (rawData.isEmpty) return;
    final chunk = utf8.decode(rawData, allowMalformed: true);
    addLog("Notify chunk received: '$chunk'");
    _asciiBuffer += chunk;
    _parseAsciiBuffer();
  }

  /// Main ASCII buffer parser.
  /// When settings are being loaded (_loadingSettings == true),
  /// only the extended sensor packet ('a') and VIN ('Z') are processed.
  void _parseAsciiBuffer() {
    if (!_loadingSettings && _settingsLoaded) {
      _asciiBuffer = "";
      return;
    }
    if (_loadingSettings) {
      int aIndex = _asciiBuffer.indexOf('a');
      if (aIndex >= 0) {
        _asciiBuffer = _asciiBuffer.substring(aIndex);
      } else {
        return;
      }
    }
    bool done = false;
    while (!done) {
      if (_asciiBuffer.isEmpty) {
        done = true;
        break;
      }
      if (_isDigit(_asciiBuffer[0])) {
        _asciiBuffer = _asciiBuffer.substring(1);
        continue;
      }
      final identifier = _asciiBuffer[0];
      _asciiBuffer = _asciiBuffer.substring(1);
      if (identifier == 'a') {
        if (_loadingSettings) {
          int byteCount = _asciiBuffer.length;
          List<dynamic> dataList = List<dynamic>.generate(48, (i) {
            return (i < byteCount) ? _asciiBuffer.codeUnitAt(i) : "X";
          });
          _asciiBuffer = (byteCount >= 48) ? _asciiBuffer.substring(48) : "";
          StringBuffer logBuffer = StringBuffer();
          logBuffer.writeln("Extended sensor packet received, total byte count: $byteCount");
          for (int i = 0; i < 48; i++) {
            logBuffer.writeln("Byte ${i + 1}: ${dataList[i]}");
          }
          addLog(logBuffer.toString());
          // Parse RPM boost values - these are two-byte values that need to be divided by 10
          // Skip the first byte (0x61 = 'a') which is the packet identifier
          // Each RPM value is stored as a 16-bit value (high byte, low byte)
          int startIndex = 1; // Start at index 1 to skip packet identifier
          rpm1500 = _parseRpmValue(dataList, startIndex);
          rpm2000 = _parseRpmValue(dataList, startIndex + 2);
          rpm2500 = _parseRpmValue(dataList, startIndex + 4);
          rpm3000 = _parseRpmValue(dataList, startIndex + 6);
          rpm3500 = _parseRpmValue(dataList, startIndex + 8);
          rpm4000 = _parseRpmValue(dataList, startIndex + 10);
          rpm4500 = _parseRpmValue(dataList, startIndex + 12);
          rpm5000 = _parseRpmValue(dataList, startIndex + 14);
          rpm5500 = _parseRpmValue(dataList, startIndex + 16);
          rpm6000 = _parseRpmValue(dataList, startIndex + 18);
          rpm6500 = _parseRpmValue(dataList, startIndex + 20);
          rpm7000 = _parseRpmValue(dataList, startIndex + 22);
          tmapSensor = (dataList[25] is int) ? dataList[25].toString() : "X";
          // Boost Limit 3rd comes from byte 26 (single byte)
          if (dataList[26] is int) {
            int value = dataList[26] as int;
            boostLimit3rd = value.toString();
          } else {
            boostLimit3rd = "X";
          }
          fuel2500 = (dataList[26] is int) ? dataList[26].toString() : "X";
          fuel3000 = (dataList[27] is int) ? dataList[27].toString() : "X";
          fuel3500 = (dataList[28] is int) ? dataList[28].toString() : "X";
          fuel4000 = (dataList[29] is int) ? dataList[29].toString() : "X";
          fuel4500 = (dataList[30] is int) ? dataList[30].toString() : "X";
          fuel5000 = (dataList[31] is int) ? dataList[31].toString() : "X";
          fuel5500 = (dataList[32] is int) ? dataList[32].toString() : "X";
          fuel6000 = (dataList[33] is int) ? dataList[33].toString() : "X";
          fuel6500 = (dataList[34] is int) ? dataList[34].toString() : "X";
          sixCylTiming = (dataList[35] is int) ? dataList[35].toString() : "X";
          cps1500 = (dataList[36] is int) ? dataList[36].toString() : "X";
          cps2000 = (dataList[37] is int) ? dataList[37].toString() : "X";
          cps2500 = (dataList[38] is int) ? dataList[38].toString() : "X";
          cps3000 = (dataList[39] is int) ? dataList[39].toString() : "X";
          cps3500 = (dataList[40] is int) ? dataList[40].toString() : "X";
          cps4000 = (dataList[41] is int) ? dataList[41].toString() : "X";
          cps4500 = (dataList[42] is int) ? dataList[42].toString() : "X";
          cps5000 = (dataList[43] is int) ? dataList[43].toString() : "X";
          cps5500 = (dataList[44] is int) ? dataList[44].toString() : "X";
          cps6000 = (dataList[45] is int) ? dataList[45].toString() : "X";
          cps6500 = (dataList[46] is int) ? dataList[46].toString() : "X";
          cps7000 = (dataList[47] is int) ? dataList[47].toString() : "X";
          _settingsLoaded = true;
          _loadingSettings = false;
          
          // Process advanced settings identifiers from ASCII buffer
          _processAdvancedSettingsIdentifiers();
          
          addLog("Extended sensor packet parsed and settings updated.");
          notifyListeners();
          continue;
        } else {
          if (_asciiBuffer.length < 48) {
            _asciiBuffer = 'a' + _asciiBuffer;
            done = true;
            break;
          }
          _asciiBuffer = _asciiBuffer.substring(48);
          addLog("Skipped 48-byte tuning block.");
          continue;
        }
      } else if (identifier == 'Z') {
        // VIN data comes after 'Z' identifier
        // Need to process 12 bytes of VIN data
        if (_asciiBuffer.length < 12) {
          _asciiBuffer = 'Z' + _asciiBuffer;
          done = true;
          break;
        }
        
        // Extract 12 bytes of VIN data
        List<int> vinBytes = [];
        for (int i = 0; i < 12; i++) {
          int byte = _asciiBuffer.codeUnitAt(i);
          // Match C# implementation: Convert 0x00 or 0xFF to space (0x20)
          if (byte == 0x00 || byte == 0xFF) {
            vinBytes.add(0x20); // ASCII space
          } else {
            vinBytes.add(byte);
          }
        }
        
        // Convert processed bytes to string and trim any whitespace
        String vinStr = String.fromCharCodes(vinBytes).trim();
        // Only update VIN if we got valid data
        if (vinStr.isNotEmpty) {
          vin = vinStr;
          addLog("Parsed VIN data: [${vinBytes.map((b) => '0x${b.toRadixString(16).padLeft(2, '0').toUpperCase()}').join(' ')}]");
          addLog("Processed VIN: '$vin'");
          notifyListeners();
        }
        _asciiBuffer = _asciiBuffer.substring(12);
      } else {
        if (_loadingSettings) {
          addLog("Ignoring identifier '$identifier' while loading settings.");
          _readDigits();
          continue;
        }
        final result = _readDigits();
        if (result == null) {
          _asciiBuffer = identifier + _asciiBuffer;
          done = true;
        } else {
          final numberStr = result;
          _handleIdentifier(identifier, numberStr);
        }
      }
    }
  }

  /// Parses a boost target value at a specific RPM point from two bytes in the data list
  /// Returns the PSI value as a string with decimal precision
  String _parseRpmValue(List<dynamic> dataList, int startIndex) {
    if (startIndex < 0 || startIndex + 1 >= dataList.length) {
      return "X";
    }
    
    // Check if both bytes are integers
    if (dataList[startIndex] is! int || dataList[startIndex + 1] is! int) {
      return "X";
    }
    
    // Match Form1.cs exactly:
    // rpm7000.Text = (Convert.ToDouble((byteIN[temp3 + 23] * 256) + byteIN[temp3 + 24]) / 10).ToString("0.0.##", CultureInfo.InvariantCulture);
    int highByte = dataList[startIndex] as int;     // First byte is high byte
    int lowByte = dataList[startIndex + 1] as int;  // Second byte is low byte
    
    // Calculate value using the exact C# formula:
    // (byteIN[temp3 + 23] * 256) + byteIN[temp3 + 24]) / 10
    double value = ((highByte * 256) + lowByte) / 10.0;
    
    // Log for debugging
    addLog("RPM value at index $startIndex:");
    addLog("  High byte (x256): $highByte (0x${highByte.toRadixString(16).padLeft(2, '0')})");
    addLog("  Low byte: $lowByte (0x${lowByte.toRadixString(16).padLeft(2, '0')})");
    addLog("  Raw value: ${(highByte * 256) + lowByte}");
    addLog("  Final PSI: $value");
    
    return value.toStringAsFixed(1);
  }

  String _parseTwoBytes(List<dynamic> dataList, int startIndex) {
    // Handle CPS values (bytes 50-61) as direct byte values
    if (startIndex >= 50 && startIndex <= 61) {
      if (dataList[startIndex] is int) {
        return dataList[startIndex].toString();
      }
      return "X";
    }

    // Handle RPM boost values (bytes 0-23)
    if (startIndex <= 23 && dataList[startIndex] is int) {
      // Get the raw value directly from the byte
      int value = dataList[startIndex] as int;
      // Log the raw value for debugging
      addLog("RPM value at index $startIndex: raw=$value");
      return value.toString();
    }

    // Handle other two-byte values
    if (dataList[startIndex] is int && dataList[startIndex + 1] is int) {
      // Match Form1.cs byte order: first byte is high byte
      int highByte = dataList[startIndex] as int;
      int lowByte = dataList[startIndex + 1] as int;
      int value = (highByte * 256) + lowByte;
      addLog("Two-byte value at index $startIndex:");
      addLog("  High byte (x256): $highByte (0x${highByte.toRadixString(16).padLeft(2, '0')})");
      addLog("  Low byte: $lowByte (0x${lowByte.toRadixString(16).padLeft(2, '0')})");
      addLog("  Raw value: $value");
      return value.toString();
    }
    
    return "X";
  }

  String? _readDigits() {
    if (_asciiBuffer.isEmpty) return null;
    int idx = 0;
    while (idx < _asciiBuffer.length) {
      final ch = _asciiBuffer[idx];
      if (_isDigit(ch)) {
        idx++;
      } else {
        break;
      }
    }
    if (idx == 0) return null;
    final digits = _asciiBuffer.substring(0, idx);
    _asciiBuffer = _asciiBuffer.substring(idx);
    return digits;
  }

  bool _isDigit(String ch) {
    final code = ch.codeUnitAt(0);
    return (code >= 48 && code <= 57);
  }

  /// Processes an incoming ASCII identifier and updates the corresponding gauge field.
  void _handleIdentifier(String identifier, String numberStr) {
    if (numberStr.isEmpty) return;
    addLog("Received identifier '$identifier' with raw string: '$numberStr'");
    double dVal = 0;
    try {
      dVal = double.parse(numberStr);
      addLog("Parsed numeric value for '$identifier': $dVal");
    } catch (e) {
      addLog("Failed to parse numeric value for '$identifier' from '$numberStr'");
    }
    switch (identifier) {
      case 'A': 
        rpm = numberStr;
        addLog("Identifier 'A': Set RPM directly to '$rpm'");
        break;
      case 'B': {
        double conv = dVal / 10.0;
        boost = conv.toStringAsFixed(1);
        addLog("Identifier 'B': Set Boost to '$boost' PSI");
      } break;
      case 'j': {
        double conv = dVal / 10.0;
        boost2 = conv.toStringAsFixed(1);
        addLog("Identifier 'j': Set Boost2 to '$boost2' PSI");
      } break;
      case 'C':
        tps = numberStr;
        addLog("Identifier 'C': Set TPS to '$tps'");
        break;
      case 'F':
        mapSelection = numberStr;
        addLog("Identifier 'F': Set Map Selection to '$mapSelection'");
        break;
      case 'G':
        iat = numberStr;
        addLog("Identifier 'G': Set IAT to '$iat'");
        break;
      case '<':
        waterTemp = numberStr;
        addLog("Identifier '<': Set Water Temp to '$waterTemp'");
        break;
      case '>':
        oilTemp = numberStr;
        addLog("Identifier '>': Set Oil Temp to '$oilTemp'");
        break;
      case 'f':
        e85 = numberStr;
        addLog("Identifier 'f': Set E85 to '$e85'");
        break;
      case 'e': {
        int val = ((dVal * 1.8) - 40).round();
        transTemp = val.toString();
        addLog("Identifier 'e': Set Trans Temp to '$transTemp'");
      } break;
      case 'H': {
        int raw = dVal.round();
        if (_lastClockRaw == 0 || raw < _lastClockRaw) {
          _lastClockRaw = raw;
          addLog("Identifier 'H': Initial clock value set to $raw");
        } else {
          double diff = (raw - _lastClockRaw).toDouble();
          clockValue = diff.toStringAsFixed(0);
          addLog("Identifier 'H': Set Clock to '$clockValue'");
          _lastClockRaw = raw;
        }
      } break;
      case 'D': {
        double calc = dVal * 0.3921568;
        pwm = calc.round().toString();
        addLog("Identifier 'D': Set PWM to '$pwm'");
      } break;
      case 'E':
        fuel = numberStr;
        addLog("Identifier 'E': Set Fuel to '$fuel'");
        break;
      case '&': {
        String conv = dVal.toStringAsFixed(1);
        egt = conv;
        addLog("Identifier '&': Set EGT to '$egt'");
      } break;
      case 'k': {
        String conv = dVal.toStringAsFixed(1);
        trims2 = conv;
        addLog("Identifier 'k': Set Trim2 to '$trims2'");
      } break;
      case '!':
        gear = numberStr;
        addLog("Identifier '!': Set Gear to '$gear'");
        break;
      case 'l': {
        double spd = dVal / 1.61;
        speed = spd.round().toString();
        addLog("Identifier 'l': Set Speed to '$speed'");
      } break;
      case '^':
        afr = numberStr;
        addLog("Identifier '^': Set AFR to '$afr'");
        break;
      case '%':
        meth = numberStr;
        addLog("Identifier '%': Set Methanol to '$meth'");
        break;
      case '\$':
        oilTempAlt = numberStr;
        addLog("Identifier '\$': Set Oil Temp Alt to '$oilTempAlt'");
        break;
      case '-': {
        int fv = (dVal / 2.55).round();
        ffPid = fv.toString();
        addLog("Identifier '-': Set FFPID to '$ffPid'");
      } break;
      case ':': {
        double a2 = dVal / 10.0;
        afr2 = a2.toStringAsFixed(1);
        addLog("Identifier ':': Set AFR2 to '$afr2'");
      } break;
      case 'Y':
        bootloaderError = true;
        addLog("Identifier 'Y': Set bootloaderError to true");
        break;
      case 'L': {
        // Convert raw value (215) to voltage (1.05)
        double av = (dVal / 1023.0 * 5.0);
        ambientVoltage = av.toStringAsFixed(2);
        addLog("Identifier 'L': Raw value $dVal converted to voltage: $ambientVoltage");
      } break;
      case 'M': {
        double conv = dVal / 10.0;
        dmeBoost = conv.toStringAsFixed(1);
        addLog("Identifier 'M': Set DME Boost to '$dmeBoost' PSI");
      } break;
      case ')': {
        String result;
        if (dVal > 500) {
          result = "50.0";
        } else {
          result = (dVal / 10.0).toStringAsFixed(1);
        }
        ignitionAdv = result;
        addLog("Identifier ')': Set Ignition Adv to '$ignitionAdv'");
      } break;
      case '(':
        {
          String result;
          if (dVal > 500) {
            result = "50.0";
          } else {
            result = (dVal / 10.0).toStringAsFixed(1);
          }
          avgIgn = result;
          addLog("Identifier '(' : Set Avg Ignition to '$avgIgn'");
        }
        break;
      case 'z':
        {
          String result;
          if (dVal > 500) {
            result = "50.0";
          } else {
            result = (dVal / 10.0).toStringAsFixed(1);
          }
          avgIgnDrop = result;
          addLog("Identifier 'z': Set Avg Ignition Drop to '$avgIgnDrop'");
        }
        break;
      case '*': {
        double conv = dVal / 10.0;
        dmeBt = conv.toStringAsFixed(1);
        addLog("Identifier '*': Set DME BT to '$dmeBt'");
      } break;
      case 'N': {
        double conv = dVal / 10.0;
        dmeTarget = conv.toStringAsFixed(1);
        addLog("Identifier 'N': Set DME Target to '$dmeTarget' PSI");
      } break;
      case 'n':
        futureUseA = numberStr;
        addLog("Identifier 'n': Set Future Use A to '$futureUseA'");
        break;
      case 'p':
        m1PidGain = numberStr;
        addLog("Identifier 'p': Set M1 PID Gain to '$m1PidGain'");
        break;
      case 'r':
        m1Throttle = numberStr;
        addLog("Identifier 'r': Set M1 Throttle to '$m1Throttle'");
        break;
      case 's':
        m1LagFix = numberStr;
        addLog("Identifier 's': Set M1 Lag Fix to '$m1LagFix'");
        break;
      case 't': {
        double conv = dVal / 10.0;
        m1BoostLimit = conv.toStringAsFixed(1);
        addLog("Identifier 't': Set M1 Boost Limit to '$m1BoostLimit' PSI");
      } break;
      case 'u':
        feedForward = numberStr;
        addLog("Identifier 'u': Set Feed Forward to '$feedForward'");
        break;
      case 'v': {
        // Match C# implementation: no division for boost limits
        boostLimit1st = numberStr;
        addLog("Identifier 'v': Set 1st Boost Limit to '$boostLimit1st' PSI");
      } break;
      case 'x': {
        // Match C# implementation: no division for boost limits
        boostLimit2nd = numberStr;
        addLog("Identifier 'x': Set 2nd Boost Limit to '$boostLimit2nd' PSI");
      } break;
      case 'w':
        m1MethHard = numberStr;
        addLog("Identifier 'w': Set M1 Meth Hard to '$m1MethHard'");
        break;
      case '@':
        methRange = numberStr;
        addLog("Identifier '@': Set Meth Range to '$methRange'");
        break;
      case 'm':
        methTrigger = numberStr;
        addLog("Identifier 'm': Set Meth Trigger to '$methTrigger'");
        break;
      // WMI Settings
      case '{':
        n1MinGear = numberStr;
        addLog("Identifier '{': Set N1 Min Gear to '$n1MinGear'");
        break;
      case '}':
        n1MinAfr = numberStr;
        addLog("Identifier '}': Set N1 Min AFR to '$n1MinAfr'");
        break;
      case '|':
        n1MinAdvance = numberStr;
        addLog("Identifier '|': Set N1 Min Advance to '$n1MinAdvance'");
        break;
      case 'o':
        fudBits = dVal.toInt();
        addLog("Identifier 'o': Set FUD Bits to '$fudBits'");
        break;
      case 'X':
        fuelPressure = numberStr;
        addLog("Identifier 'X': Set Fuel Pressure to '$fuelPressure'");
        break;
      case 'q': {
        // Store the first part of firmware version
        jb4Firmware = numberStr;
        addLog("Identifier 'q': Initial firmware version: $jb4Firmware");
      } break;
      case '/': {
        // Append the additional version components
        if (jb4Firmware.isNotEmpty) {
          jb4Firmware = "$jb4Firmware/$numberStr";
          addLog("Identifier '/': Updated firmware version: $jb4Firmware");
        } else {
          addLog("Identifier '/': Received version component but no initial version");
          jb4Firmware = numberStr; // Store it anyway in case we get more components
        }
      } break;
      case 'P': {
        String conv = dVal.toStringAsFixed(1);
        n1MinPsi = conv;
        addLog("Identifier 'P': Set N1 Min PSI to '$n1MinPsi'");
      } break;
      case 'Q':
        n1Enabled = numberStr;
        addLog("Identifier 'Q': Set N1 Enabled to '$n1Enabled'");
        break;
      case 'R': {
        int bits = dVal.toInt();
        e85Bits = bits;
        addLog("Identifier 'R': Set E85 Bits to '$e85Bits'");
      } break;
      case 'S':
        n1MinRpm = numberStr;
        addLog("Identifier 'S': Set N1 Min RPM to '$n1MinRpm'");
        break;
      case 'T':
        n1MaxRpm = numberStr;
        addLog("Identifier 'T': Set N1 Max RPM to '$n1MaxRpm'");
        break;
      case 'U':
        n1RampRate = numberStr;
        addLog("Identifier 'U': Set N1 Ramp Rate to '$n1RampRate'");
        break;
      case 'V':
        virtualFfOffset = numberStr;
        addLog("Identifier 'V': Set Virtual FF Offset to '$virtualFfOffset'");
        break;
      case '+':
        openLoop = numberStr;
        addLog("Identifier '+': Set Open Loop to '$openLoop'");
        break;
      case '`':
        methSafety = numberStr;
        addLog("Identifier '`': Set Meth Safety to '$methSafety'");
        break;
      case '=': {
        double cpsi = dVal / 10.0;
        cpsValue = cpsi.toStringAsFixed(1);
        addLog("Identifier '=': Set CPS to '$cpsValue'");
      } break;
      case '#':
        lastSafety = numberStr;
        addLog("Identifier '#': Set Last Safety to '$lastSafety'");
        break;
      case 'W':
        accel = numberStr;
        addLog("Identifier 'W': Set Acceleration to '$accel'");
        break;
      case '{':
        n1MinGear = numberStr;
        addLog("Identifier '{': Set N1 Min Gear to '$n1MinGear'");
        break;
      case '}':
        n1MinAfr = numberStr;
        addLog("Identifier '}': Set N1 Min AFR to '$n1MinAfr'");
        break;
      case '|':
        n1MinAdvance = numberStr;
        addLog("Identifier '|': Set N1 Min Advance to '$n1MinAdvance'");
        break;
      case '~': {
        String conv = dVal.toStringAsFixed(1);
        kr1 = conv;
        addLog("Identifier '~': Set KR1 to '$kr1'");
      } break;
      case 'I': {
        String conv = dVal.toStringAsFixed(1);
        kr2 = conv;
        addLog("Identifier 'I': Set KR2 to '$kr2'");
      } break;
      case 'J': {
        String conv = dVal.toStringAsFixed(1);
        kr3 = conv;
        addLog("Identifier 'J': Set KR3 to '$kr3'");
      } break;
      case 'O': {
        String conv = dVal.toStringAsFixed(1);
        kr4 = conv;
        addLog("Identifier 'O': Set KR4 to '$kr4'");
      } break;
      case 'K': {
        String conv = dVal.toStringAsFixed(1);
        kr5 = conv;
        addLog("Identifier 'K': Set KR5 to '$kr5'");
      } break;
      case 'y': {
        String conv = dVal.toStringAsFixed(1);
        kr6 = conv;
        addLog("Identifier 'y': Set KR6 to '$kr6'");
      } break;
      case '[': {
        String conv = dVal.toStringAsFixed(1);
        kr7 = conv;
        addLog("Identifier '[': Set KR7 to '$kr7'");
      } break;
      case '\\': {
        String conv = dVal.toStringAsFixed(1);
        kr8 = conv;
        addLog("Identifier '\\': Set KR8 to '$kr8'");
      } break;
      case ']':
        aux1 = numberStr;
        addLog("Identifier ']': Set Aux 1 to '$aux1'");
        break;
      case '_':
        aux2 = numberStr;
        addLog("Identifier '_': Set Aux 2 to '$aux2'");
        break;
      case 'b':
        aux3 = numberStr;
        addLog("Identifier 'b': Set Aux 3 to '$aux3'");
        break;
      case 'c':
        aux4 = numberStr;
        addLog("Identifier 'c': Set Aux 4 to '$aux4'");
        break;
      case 'd':
        aux5 = numberStr;
        addLog("Identifier 'd': Set Aux 5 to '$aux5'");
        break;
      case 'g':
        aux6 = numberStr;
        addLog("Identifier 'g': Set Aux 6 to '$aux6'");
        break;
      case 'h':
        maf1 = numberStr;
        addLog("Identifier 'h': Set MAF Sensor 1 to '$maf1'");
        break;
      case 'i':
        maf2 = numberStr;
        addLog("Identifier 'i': Set MAF Sensor 2 to '$maf2'");
        break;
      default:
        addLog("Unknown identifier '$identifier' with value '$numberStr'");
        break;
    }
    notifyListeners();
  }

  /// --------------------------------------------------------------------------
  /// Updated method to parse the 48-byte extended sensor packet.
  /// According to the cheat sheet, the packet (after the leading 'a')
  /// is structured as follows:
  ///
  /// - Bytes 1-2: RPM 1500: (byte0<<8 | byte1)/10
  /// - Bytes 3-4: RPM 2000
  /// - Bytes 5-6: RPM 2500
  /// - Bytes 7-8: RPM 3000
  /// - Bytes 9-10: RPM 3500
  /// - Bytes 11-12: RPM 4000
  /// - Bytes 13-14: RPM 4500
  /// - Bytes 15-16: RPM 5000
  /// - Bytes 17-18: RPM 5500
  /// - Bytes 19-20: RPM 6000
  /// - Bytes 21-22: RPM 6500
  /// - Bytes 23-24: RPM 7000
  /// - Byte 25: TMAP Sensor (raw)
  /// - Byte 26: Boost Limit 3rd (formatted to 1 decimal, e.g. value/10)
  /// - Bytes 27-35: Fuel settings for 2500,3000,...,6500 RPM (raw)
  /// - Byte 36: Six-Cylinder Timing (raw)
  /// - Bytes 37-48: CPS values for 1500,2000,...,7000 RPM (raw)
  /// --------------------------------------------------------------------------
  void parseExtendedSensorPacket(String packet) {
    List<int> bytes = packet.codeUnits;
    int totalByteCount = bytes.length;
    List<dynamic> dataList = List<dynamic>.generate(48, (i) {
      return (i < totalByteCount) ? bytes[i] : "X";
    });
    
    // Log complete packet in hex
    StringBuffer hexLog = StringBuffer("Extended sensor packet in hex: ");
    for (int i = 0; i < totalByteCount; i++) {
      if (bytes[i] is int) {
        hexLog.write('${bytes[i].toRadixString(16).padLeft(2, '0').toUpperCase()} ');
      } else {
        hexLog.write('XX ');
      }
    }
    addLog(hexLog.toString());

    // Log each byte with its value
    addLog("Extended sensor packet received, total byte count: $totalByteCount");
    StringBuffer sb = StringBuffer();
    for (int i = 0; i < 48; i++) {
      String hexValue = (dataList[i] is int) 
          ? '0x${dataList[i].toRadixString(16).padLeft(2, '0').toUpperCase()}'
          : 'X';
      sb.writeln("Byte ${i + 1}: $hexValue (${dataList[i]})");
    }
    addLog(sb.toString());

    // Special focus on bytes around 7000 RPM value (bytes 23-24)
    if (dataList[23] is int && dataList[24] is int) {
      addLog("7000 RPM bytes (23-24):");
      addLog("Byte 23 (x256): 0x${dataList[23].toRadixString(16).padLeft(2, '0').toUpperCase()} (${dataList[23]})");
      addLog("Byte 24: 0x${dataList[24].toRadixString(16).padLeft(2, '0').toUpperCase()} (${dataList[24]})");
      // Match Form1.cs exactly:
      // (byteIN[temp3 + 23] * 256) + byteIN[temp3 + 24]) / 10
      int rawValue = (dataList[23] * 256) + dataList[24];
      double psiValue = rawValue / 10.0;
      addLog("7000 RPM calculation: (${dataList[23]} * 256 + ${dataList[24]}) / 10.0 = $psiValue PSI");
    }

    // Parse RPM boost values using the exact C# formula:
    // rpm7000.Text = (Convert.ToDouble((byteIN[temp3 + 23] * 256) + byteIN[temp3 + 24]) / 10).ToString("0.0.##", CultureInfo.InvariantCulture);
    void parseRpmValue(int startIndex, void Function(String) setter) {
      if (startIndex + 1 >= dataList.length || 
          dataList[startIndex] is! int || 
          dataList[startIndex + 1] is! int) {
        setter("X");
        return;
      }
      
      // First byte is multiplied by 256 in Form1.cs
      int firstByte = dataList[startIndex] as int;
      int secondByte = dataList[startIndex + 1] as int;
      
      // Match Form1.cs exactly:
      // (byteIN[temp3 + 23] * 256) + byteIN[temp3 + 24]) / 10
      double value = ((firstByte * 256) + secondByte) / 10.0;
      
      addLog("RPM bytes at $startIndex:");
      addLog("  First byte (x256): $firstByte (0x${firstByte.toRadixString(16).padLeft(2, '0')})");
      addLog("  Second byte: $secondByte (0x${secondByte.toRadixString(16).padLeft(2, '0')})");
      addLog("  Raw value: ${(firstByte * 256) + secondByte}");
      addLog("  Final PSI: $value");
      
      setter(value.toStringAsFixed(1));
    }

    parseRpmValue(0, (v) => rpm1500 = v);
    parseRpmValue(2, (v) => rpm2000 = v);
    parseRpmValue(4, (v) => rpm2500 = v);
    parseRpmValue(6, (v) => rpm3000 = v);
    parseRpmValue(8, (v) => rpm3500 = v);
    parseRpmValue(10, (v) => rpm4000 = v);
    parseRpmValue(12, (v) => rpm4500 = v);
    parseRpmValue(14, (v) => rpm5000 = v);
    parseRpmValue(16, (v) => rpm5500 = v);
    parseRpmValue(18, (v) => rpm6000 = v);
    parseRpmValue(20, (v) => rpm6500 = v);
    parseRpmValue(22, (v) => rpm7000 = v);

    // TMAP 3.5bar value from byte 25
    tmapSensor = (dataList[25] is int) ? dataList[25].toString() : "X";
    
    // Boost Limit 3rd comes from byte 26 (single byte, no division)
    if (dataList[26] is int) {
      int value = dataList[26] as int;
      boostLimit3rd = value.toStringAsFixed(1);
    } else {
      boostLimit3rd = "X";
    }

    // Fuel settings (bytes 26-34)
    fuel2500 = (dataList[26] is int) ? dataList[26].toString() : "X";
    fuel3000 = (dataList[27] is int) ? dataList[27].toString() : "X";
    fuel3500 = (dataList[28] is int) ? dataList[28].toString() : "X";
    fuel4000 = (dataList[29] is int) ? dataList[29].toString() : "X";
    fuel4500 = (dataList[30] is int) ? dataList[30].toString() : "X";
    fuel5000 = (dataList[31] is int) ? dataList[31].toString() : "X";
    fuel5500 = (dataList[32] is int) ? dataList[32].toString() : "X";
    fuel6000 = (dataList[33] is int) ? dataList[33].toString() : "X";
    fuel6500 = (dataList[34] is int) ? dataList[34].toString() : "X";
    
    // Six-Cylinder Timing (byte 35)
    sixCylTiming = (dataList[35] is int) ? dataList[35].toString() : "X";
    
    // CPS (duty bias) values (bytes 36-47)
    // These are single bytes that represent percentages (0-100)
    cps1500 = (dataList[36] is int) ? (dataList[36] as int).toString() : "X";
    cps2000 = (dataList[37] is int) ? (dataList[37] as int).toString() : "X";
    cps2500 = (dataList[38] is int) ? (dataList[38] as int).toString() : "X";
    cps3000 = (dataList[39] is int) ? (dataList[39] as int).toString() : "X";
    cps3500 = (dataList[40] is int) ? (dataList[40] as int).toString() : "X";
    cps4000 = (dataList[41] is int) ? (dataList[41] as int).toString() : "X";
    cps4500 = (dataList[42] is int) ? (dataList[42] as int).toString() : "X";
    cps5000 = (dataList[43] is int) ? (dataList[43] as int).toString() : "X";
    cps5500 = (dataList[44] is int) ? (dataList[44] as int).toString() : "X";
    cps6000 = (dataList[45] is int) ? (dataList[45] as int).toString() : "X";
    cps6500 = (dataList[46] is int) ? (dataList[46] as int).toString() : "X";
    cps7000 = (dataList[47] is int) ? (dataList[47] as int).toString() : "X";

    StringBuffer summary = StringBuffer();
    summary.writeln("Calculated Fields:");
    summary.writeln("RPM1500=$rpm1500, RPM2000=$rpm2000, RPM2500=$rpm2500, RPM3000=$rpm3000, RPM3500=$rpm3500, "
      "RPM4000=$rpm4000, RPM4500=$rpm4500, RPM5000=$rpm5000, RPM5500=$rpm5500, RPM6000=$rpm6000, "
      "RPM6500=$rpm6500, RPM7000=$rpm7000");
    summary.writeln("TMAP Sensor=$tmapSensor, Boost Limit 3rd=$boostLimit3rd");
    summary.writeln("Fuel: 2500=$fuel2500, 3000=$fuel3000, 3500=$fuel3500, 4000=$fuel4000, 4500=$fuel4500, "
      "5000=$fuel5000, 5500=$fuel5500, 6000=$fuel6000, 6500=$fuel6500");
    summary.writeln("Six-Cyl Timing=$sixCylTiming");
    summary.writeln("CPS: 1500=$cps1500, 2000=$cps2000, 2500=$cps2500, 3000=$cps3000, 3500=$cps3500, "
      "4000=$cps4000, 4500=$cps4500, 5000=$cps5000, 5500=$cps5500, 6000=$cps6000, 6500=$cps6500, 7000=$cps7000");
    addLog(summary.toString());
    notifyListeners();
  }

  // --------------------------------------------------------------------------
  // BLE Scanning/Connection Logic
  // --------------------------------------------------------------------------
  /// Initiates a scan for the device named _deviceName and attempts to connect.
  Future<void> scanAndConnect() async {
    _status = "Scanning for JB4PRO...";
    notifyListeners();
    addLogMessage("Started scanning for JB4PRO...");
    try {
      await _scanSubscription?.cancel();
      _scanSubscription = _ble
          .scanForDevices(withServices: [], scanMode: ScanMode.lowLatency)
          .listen((device) {
        addLogMessage("Discovered device: ${device.name} (${device.id})");
        if (device.name == _deviceName) {
          _device = device;
          _status = "Device Found. Connecting...";
          notifyListeners();
          addLogMessage("Found JB4PRO device. Attempting to connect...");
          _connectToDevice();
          _scanSubscription?.cancel();
        }
      }, onError: (error) {
        _setError("Error during scan: $error");
        _status = "Scan Failed";
        notifyListeners();
      });
    } catch (e) {
      _setError("Error initiating scan: $e");
      _status = "Failed";
      notifyListeners();
    }
  }

  /// Connects to the discovered device.
  Future<void> _connectToDevice() async {
    if (_device == null) {
      _setError("No device to connect to.");
      return;
    }
    addLog("Connecting to ${_device!.id}...");
    try {
      await _connectionSubscription?.cancel();
      _connectionSubscription = _ble
          .connectToDevice(
            id: _device!.id,
            connectionTimeout: const Duration(seconds: 10),
          )
          .listen((connectionState) {
        switch (connectionState.connectionState) {
          case DeviceConnectionState.connected:
            _status = "Connected";
            notifyListeners();
            addLogMessage("Connected to JB4PRO.");
            _discoverServices();
            break;
          case DeviceConnectionState.disconnected:
            _status = "Disconnected";
            notifyListeners();
            addLogMessage("Disconnected from JB4PRO.");
            break;
          case DeviceConnectionState.connecting:
            _status = "Connecting...";
            notifyListeners();
            addLogMessage("Connecting to JB4PRO...");
            break;
          case DeviceConnectionState.disconnecting:
            _status = "Disconnecting...";
            notifyListeners();
            addLogMessage("Disconnecting from JB4PRO...");
            break;
        }
      }, onError: (error) {
        _setError("Connection error: $error");
        _status = "Connection Failed";
        notifyListeners();
      });
    } catch (e) {
      _setError("Connection failed: $e");
      _status = "Failed";
      notifyListeners();
    }
  }

  // --------------------------------------------------------------------------
  // Additional Getters and Helpers
  // --------------------------------------------------------------------------
  String get asciiBuffer => _asciiBuffer;

  void clearAsciiBuffer() {
    _asciiBuffer = "";
    addLog("ASCII buffer cleared");
  }

  /// Discovers services on the connected device and sets up characteristics.
  Future<void> _discoverServices() async {
    if (_device == null) return;
    try {
      addLogMessage("Discovering services for JB4PRO...");
      final services = await _ble.discoverServices(_device!.id);
      for (var service in services) {
        addLogMessage("Service found: ${service.serviceId}");
        for (var characteristic in service.characteristics) {
          addLogMessage("Characteristic found: ${characteristic.characteristicId}");
        }
      }
      _setUpCharacteristics(services);
    } catch (e) {
      _setError("Error discovering services: $e");
    }
  }

  /// Sets up the write and notify characteristics.
  void _setUpCharacteristics(List<DiscoveredService> services) {
    try {
      final service = services.firstWhere(
        (svc) => svc.serviceId == _serviceUuid,
        orElse: () => throw Exception("Service $_serviceUuid not found"),
      );
      final writeChar = service.characteristics.firstWhere(
        (char) => char.characteristicId == _writeUuid,
        orElse: () => throw Exception("Write Characteristic not found"),
      );
      final notifyChar = service.characteristics.firstWhere(
        (char) => char.characteristicId == _notifyUuid,
        orElse: () => throw Exception("Notify Characteristic not found"),
      );
      _writeCharacteristic = QualifiedCharacteristic(
        serviceId: _serviceUuid,
        characteristicId: _writeUuid,
        deviceId: _device!.id,
      );
      _notifyCharacteristic = QualifiedCharacteristic(
        serviceId: _serviceUuid,
        characteristicId: _notifyUuid,
        deviceId: _device!.id,
      );
      addLogMessage("Successfully set up characteristics for JB4PRO.");
      _notifySubscription = _ble
          .subscribeToCharacteristic(_notifyCharacteristic!)
          .listen(_handleNotification, onError: (error) {
        _setError("Error receiving data: $error");
      });
    } catch (e) {
      _setError("Error setting up characteristics: $e");
    }
  }

  static List<int> wordToBytes(int input) {
    // Match Form1.cs WordToBytes exactly:
    int temp, temp2;
    
    if (input > 255) {
      // temp3 = Math.Floor(Convert.ToDecimal(input / 256))
      // temp = Convert.ToInt32(temp3)
      // temp2 = input - (temp * 256)
      temp = input ~/ 256;  // Integer division for floor division
      temp2 = input - (temp * 256);
    } else {
      temp = 0;
      temp2 = input;
    }
    
    return [temp, temp2];  // Returns [high byte, low byte]
  }

  /// Saves RPM boost values to a byte array in the correct order
  /// Returns a list of bytes with the RPM boost values in the correct order
  List<int> saveRpmBoostValues() {
    List<int> bytes = [];
    
    // Helper that exactly matches Form1.cs savesettings:
    // b[23] = WordToBytes(Convert.ToInt32(Convert.ToDouble(rpm7000.Text) * 10))[0];
    // b[24] = WordToBytes(Convert.ToInt32(Convert.ToDouble(rpm7000.Text) * 10))[1];
    void addRpmValue(String psiStr) {
      try {
        // Parse PSI value and multiply by 10 to match C# implementation
        double psi = double.parse(psiStr);
        int intValue = (psi * 10).round();
        
        // Convert to bytes using wordToBytes helper
        List<int> wordBytes = wordToBytes(intValue);
        
        // Log for debugging
        addLog("Converting PSI $psiStr:");
        addLog("  Multiplied by 10: $intValue");
        addLog("  High byte: 0x${wordBytes[0].toRadixString(16).padLeft(2, '0')}");
        addLog("  Low byte: 0x${wordBytes[1].toRadixString(16).padLeft(2, '0')}");
        
        bytes.addAll(wordBytes);
      } catch (e) {
        addLog("Error converting PSI $psiStr: $e");
        bytes.addAll([0, 0]);
      }
    }
    
    // Add RPM boost values in order
    addRpmValue(rpm1500);
    addRpmValue(rpm2000);
    addRpmValue(rpm2500);
    addRpmValue(rpm3000);
    addRpmValue(rpm3500);
    addRpmValue(rpm4000);
    addRpmValue(rpm4500);
    addRpmValue(rpm5000);
    addRpmValue(rpm5500);
    addRpmValue(rpm6000);
    addRpmValue(rpm6500);
    addRpmValue(rpm7000);
    
    return bytes;
  }

  /// Converts a PSI value (as string with decimal) to a pair of bytes for saving
  /// Returns [lowByte, highByte] to match C# implementation
  List<int> psiToBytes(String psiStr) {
    try {
      // Parse PSI value and multiply by 10 to match C# implementation
      double psi = double.parse(psiStr);
      int intValue = (psi * 10).round();
      
      // Use wordToBytes helper to match C# implementation exactly
      List<int> wordBytes = wordToBytes(intValue);
      
      // Log for debugging
      addLog("Converting PSI $psiStr to bytes: value=$intValue, bytes=[0x${wordBytes[0].toRadixString(16).padLeft(2, '0')}, 0x${wordBytes[1].toRadixString(16).padLeft(2, '0')}]");
      
      // Return bytes in original order from wordToBytes
      return wordBytes; // Keep original byte order (high byte, low byte)
    } catch (e) {
      addLog("Error converting PSI $psiStr to bytes: $e");
      return [0, 0];
    }
  }

  static int computeChecksum(Uint8List data, int start, int end) {
    int sum = 0;
    for (int i = start; i <= end; i++) {
      sum += data[i];
    }
    return sum % 256;
  }
  
  /// Parses the WMI settings packet (T command response)
  void _parseWmiSettingsPacket(List<int> data) {
    if (data.length < 26 || data[0] != 0x54) { // 'T'
      addLog("Invalid WMI settings packet: length=${data.length}, first byte=0x${data[0].toRadixString(16).padLeft(2, '0')}");
      return;
    }
    
    addLog("Parsing WMI settings packet (26 bytes)");
    
    try {
      // Bytes 1-2: N1MinPsi (convert from PSI*10 format)
      // Match Form1.cs byte order: first byte is high byte
      int highByte = data[1];
      int lowByte = data[2];
      int n1MinPsiRaw = (highByte * 256) + lowByte;
      double n1MinPsiValue = n1MinPsiRaw / 10.0;
      n1MinPsi = n1MinPsiValue.toString();
      addLog("N1MinPsi (bytes 1-2): raw=$n1MinPsiRaw, value=$n1MinPsiValue PSI");
      
      // Bytes 3-4: N1Enabled
      int n1EnabledValue = (data[3] << 8) | data[4];
      n1Enabled = n1EnabledValue.toString();
      addLog("N1Enabled (bytes 3-4): $n1EnabledValue");
      
      // Bytes 5-6: E85 bits
      int e85BitsValue = data[5]; // Use first byte
      e85Bits = e85BitsValue;
      
      // Parse E85 bits
      _ethanolSetup = e85BitsValue & 0x0F; // Lower 4 bits
      _scalePiOnFlexFuel = (e85BitsValue & 0x10) != 0;
      _startupE85Indicator = (e85BitsValue & 0x20) != 0;
      _blockedInUSA = (e85BitsValue & 0x40) != 0;
      _enableWmiPumpPwm = (e85BitsValue & 0x80) != 0;
      
      addLog("E85 bits (bytes 5-6): 0x${e85BitsValue.toRadixString(16).padLeft(2, '0')} [" +
        (_ethanolSetup > 0 ? "FlexFuel Input $_ethanolSetup, " : "") +
        (_scalePiOnFlexFuel ? "Scale PI, " : "") +
        (_startupE85Indicator ? "E85 Indicator, " : "") +
        (_blockedInUSA ? "Blocked USA, " : "") +
        (_enableWmiPumpPwm ? "WMI Pump PWM" : "") +
        "]");
      
      // Bytes 7-8: N1MinRpm
      int n1MinRpmValue = (data[7] << 8) | data[8];
      n1MinRpm = n1MinRpmValue.toString();
      addLog("N1MinRpm (bytes 7-8): $n1MinRpmValue RPM");
      
      // Bytes 9-10: N1MaxRpm
      int n1MaxRpmValue = (data[9] << 8) | data[10];
      n1MaxRpm = n1MaxRpmValue.toString();
      addLog("N1MaxRpm (bytes 9-10): $n1MaxRpmValue RPM");
      
      // Bytes 11-12: N1RampRate
      int n1RampRateValue = (data[11] << 8) | data[12];
      n1RampRate = n1RampRateValue.toString();
      addLog("N1RampRate (bytes 11-12): $n1RampRateValue");
      
      // Bytes 13-14: VirtualFfOffset
      int virtualFfOffsetValue = (data[13] << 8) | data[14];
      virtualFfOffset = virtualFfOffsetValue.toString();
      addLog("VirtualFfOffset (bytes 13-14): $virtualFfOffsetValue");
      
      // Bytes 15-16: M1MethHard
      int m1MethHardValue = (data[15] << 8) | data[16];
      m1MethHard = m1MethHardValue.toString();
      addLog("M1MethHard (bytes 15-16): $m1MethHardValue");
      
      // Bytes 17-18: MethRange
      int methRangeValue = (data[17] << 8) | data[18];
      methRange = methRangeValue.toString();
      addLog("MethRange (bytes 17-18): $methRangeValue");
      
      // Bytes 19-20: N1MinGear
      int n1MinGearValue = (data[19] << 8) | data[20];
      n1MinGear = n1MinGearValue.toString();
      addLog("N1MinGear (bytes 19-20): $n1MinGearValue");
      
      // Bytes 21-22: N1MinAfr
      int n1MinAfrValue = (data[21] << 8) | data[22];
      n1MinAfr = n1MinAfrValue.toString();
      addLog("N1MinAfr (bytes 21-22): $n1MinAfrValue");
      
      // Bytes 23-24: N1MinAdvance
      int n1MinAdvanceValue = (data[23] << 8) | data[24];
      n1MinAdvance = n1MinAdvanceValue.toString();
      addLog("N1MinAdvance (bytes 23-24): $n1MinAdvanceValue");
      
      // Byte 25: End marker '$'
      if (data[25] != 36) { // ASCII '$'
        addLog("Warning: WMI settings packet has invalid end marker: 0x${data[25].toRadixString(16).padLeft(2, '0')}");
      }
      
      addLog("WMI settings packet parsed successfully");
      
      // Set _settingsLoaded to true to indicate that settings have been loaded
      _settingsLoaded = true;
      
      // Notify listeners to update UI
      notifyListeners();
    } catch (e) {
      addLog("Error parsing WMI settings packet: $e");
      // Try to log as much information as possible about the packet
      StringBuffer packetInfo = StringBuffer("WMI packet data: ");
      for (int i = 0; i < data.length; i++) {
        packetInfo.write("0x${data[i].toRadixString(16).padLeft(2, '0')} ");
      }
      addLog(packetInfo.toString());
    }
  }

  /// Processes ASCII identifiers for advanced settings
  /// This is needed because some settings are returned as ASCII characters
  /// For example, 's1' corresponds to M1LagFix, 't1' corresponds to M1BoostLimit, etc.
  void _processAdvancedSettingsIdentifiers() {
    // Process ASCII identifiers for advanced settings
    addLog("Processing advanced settings identifiers from ASCII buffer");
    
    // Look for 's' identifier (M1LagFix)
    int sIndex = _asciiBuffer.indexOf('s');
    if (sIndex >= 0 && sIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(sIndex + 1);
      if (value.isNotEmpty) {
        m1LagFix = value;
        addLog("Found 's' identifier: M1LagFix = $value");
      }
    }
    
    // Look for 't' identifier (M1BoostLimit)
    int tIndex = _asciiBuffer.indexOf('t');
    if (tIndex >= 0 && tIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(tIndex + 1);
      if (value.isNotEmpty) {
        double boostLimit = double.tryParse(value) ?? 0.0;
        m1BoostLimit = (boostLimit / 10.0).toString();
        addLog("Found 't' identifier: M1BoostLimit = $m1BoostLimit");
      }
    }
    
    // Look for 'p' identifier (M1PidGain)
    int pIndex = _asciiBuffer.indexOf('p');
    if (pIndex >= 0 && pIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(pIndex + 1);
      if (value.isNotEmpty) {
        m1PidGain = value;
        addLog("Found 'p' identifier: M1PidGain = $value");
      }
    }
    
    // Look for 'r' identifier (M1Throttle)
    int rIndex = _asciiBuffer.indexOf('r');
    if (rIndex >= 0 && rIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(rIndex + 1);
      if (value.isNotEmpty) {
        m1Throttle = value;
        addLog("Found 'r' identifier: M1Throttle = $value");
      }
    }
    
    // Look for 'u' identifier (FeedForward)
    int uIndex = _asciiBuffer.indexOf('u');
    if (uIndex >= 0 && uIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(uIndex + 1);
      if (value.isNotEmpty) {
        feedForward = value;
        addLog("Found 'u' identifier: FeedForward = $value");
      }
    }
    
    // Look for 'v' identifier (BoostLimit1st)
    int vIndex = _asciiBuffer.indexOf('v');
    if (vIndex >= 0 && vIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(vIndex + 1);
      if (value.isNotEmpty) {
        boostLimit1st = value;
        addLog("Found 'v' identifier: BoostLimit1st = $value");
      }
    }
    
    // Look for 'x' identifier (BoostLimit2nd)
    int xIndex = _asciiBuffer.indexOf('x');
    if (xIndex >= 0 && xIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(xIndex + 1);
      if (value.isNotEmpty) {
        boostLimit2nd = value;
        addLog("Found 'x' identifier: BoostLimit2nd = $value");
      }
    }
    
    // Look for 'w' identifier (M1MethHard)
    int wIndex = _asciiBuffer.indexOf('w');
    if (wIndex >= 0 && wIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(wIndex + 1);
      if (value.isNotEmpty) {
        m1MethHard = value;
        addLog("Found 'w' identifier: M1MethHard = $value");
      }
    }
    
    // Look for '@' identifier (MethRange)
    int atIndex = _asciiBuffer.indexOf('@');
    if (atIndex >= 0 && atIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(atIndex + 1);
      if (value.isNotEmpty) {
        methRange = value;
        addLog("Found '@' identifier: MethRange = $value");
      }
    }
    
    // Look for 'm' identifier (MethTrigger)
    int mIndex = _asciiBuffer.indexOf('m');
    if (mIndex >= 0 && mIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(mIndex + 1);
      if (value.isNotEmpty) {
        methTrigger = value;
        addLog("Found 'm' identifier: MethTrigger = $value");
      }
    }
    
    // Look for '+' identifier (OpenLoop)
    int plusIndex = _asciiBuffer.indexOf('+');
    if (plusIndex >= 0 && plusIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(plusIndex + 1);
      if (value.isNotEmpty) {
        openLoop = value;
        addLog("Found '+' identifier: OpenLoop = $value");
      }
    }
    
    // Look for '`' identifier (MethSafety)
    int backTickIndex = _asciiBuffer.indexOf('`');
    if (backTickIndex >= 0 && backTickIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(backTickIndex + 1);
      if (value.isNotEmpty) {
        methSafety = value;
        addLog("Found '`' identifier: MethSafety = $value");
      }
    }
    
    // Look for 'P' identifier (N1MinPsi)
    int capPIndex = _asciiBuffer.indexOf('P');
    if (capPIndex >= 0 && capPIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(capPIndex + 1);
      if (value.isNotEmpty) {
        double psiValue = double.tryParse(value) ?? 0.0;
        n1MinPsi = psiValue.toString();
        addLog("Found 'P' identifier: N1MinPsi = $n1MinPsi");
      }
    }
    
    // Look for 'Q' identifier (N1Enabled)
    int capQIndex = _asciiBuffer.indexOf('Q');
    if (capQIndex >= 0 && capQIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(capQIndex + 1);
      if (value.isNotEmpty) {
        n1Enabled = value;
        addLog("Found 'Q' identifier: N1Enabled = $value");
      }
    }
    
    // Look for 'R' identifier (E85Bits)
    int capRIndex = _asciiBuffer.indexOf('R');
    if (capRIndex >= 0 && capRIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(capRIndex + 1);
      if (value.isNotEmpty) {
        e85Bits = int.tryParse(value) ?? 0;
        addLog("Found 'R' identifier: E85Bits = $e85Bits");
      }
    }
    
    // Look for 'S' identifier (N1MinRpm)
    int capSIndex = _asciiBuffer.indexOf('S');
    if (capSIndex >= 0 && capSIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(capSIndex + 1);
      if (value.isNotEmpty) {
        n1MinRpm = value;
        addLog("Found 'S' identifier: N1MinRpm = $value");
      }
    }
    
    // Look for 'T' identifier (N1MaxRpm)
    int capTIndex = _asciiBuffer.indexOf('T');
    if (capTIndex >= 0 && capTIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(capTIndex + 1);
      if (value.isNotEmpty) {
        n1MaxRpm = value;
        addLog("Found 'T' identifier: N1MaxRpm = $value");
      }
    }
    
    // Look for 'U' identifier (N1RampRate)
    int capUIndex = _asciiBuffer.indexOf('U');
    if (capUIndex >= 0 && capUIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(capUIndex + 1);
      if (value.isNotEmpty) {
        n1RampRate = value;
        addLog("Found 'U' identifier: N1RampRate = $value");
      }
    }
    
    // Look for 'V' identifier (VirtualFfOffset)
    int capVIndex = _asciiBuffer.indexOf('V');
    if (capVIndex >= 0 && capVIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(capVIndex + 1);
      if (value.isNotEmpty) {
        virtualFfOffset = value;
        addLog("Found 'V' identifier: VirtualFfOffset = $value");
      }
    }
    
    // Look for '{' identifier (N1MinGear)
    int leftBraceIndex = _asciiBuffer.indexOf('{');
    if (leftBraceIndex >= 0 && leftBraceIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(leftBraceIndex + 1);
      if (value.isNotEmpty) {
        n1MinGear = value;
        addLog("Found '{' identifier: N1MinGear = $value");
      }
    }
    
    // Look for '}' identifier (N1MinAfr)
    int rightBraceIndex = _asciiBuffer.indexOf('}');
    if (rightBraceIndex >= 0 && rightBraceIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(rightBraceIndex + 1);
      if (value.isNotEmpty) {
        n1MinAfr = value;
        addLog("Found '}' identifier: N1MinAfr = $value");
      }
    }
    
    // Look for '|' identifier (N1MinAdvance)
    int pipeIndex = _asciiBuffer.indexOf('|');
    if (pipeIndex >= 0 && pipeIndex + 1 < _asciiBuffer.length) {
      String value = _readDigitsAt(pipeIndex + 1);
      if (value.isNotEmpty) {
        n1MinAdvance = value;
        addLog("Found '|' identifier: N1MinAdvance = $value");
      }
    }
  }
  
  /// Helper method to read digits starting at a specific index
  String _readDigitsAt(int startIndex) {
    if (startIndex >= _asciiBuffer.length) return "";
    
    int idx = startIndex;
    while (idx < _asciiBuffer.length) {
      final ch = _asciiBuffer[idx];
      if (_isDigit(ch)) {
        idx++;
      } else {
        break;
      }
    }
    
    if (idx == startIndex) return "";
    return _asciiBuffer.substring(startIndex, idx);
  }

  // --------------------------------------------------------------------------
  // Disconnect & Cleanup
  // --------------------------------------------------------------------------
  Future<void> disconnect() async {
    addLog("Disconnecting...");
    await _scanSubscription?.cancel();
    await _connectionSubscription?.cancel();
    await _notifySubscription?.cancel();
    _device = null;
    _writeCharacteristic = null;
    _notifyCharacteristic = null;
    _setStatus("Disconnected");
  }

  @override
  void dispose() {
    _scanSubscription?.cancel();
    _connectionSubscription?.cancel();
    _notifySubscription?.cancel();
    _ble.deinitialize();
    super.dispose();
  }
}

// --------------------------------------------------------------------------
// Global helper functions (if needed outside the provider)
// --------------------------------------------------------------------------
List<int> wordToBytes(int value) => JB4BleProvider.wordToBytes(value);
int computeChecksum(Uint8List data, int start, int end) =>
    JB4BleProvider.computeChecksum(data, start, end);
