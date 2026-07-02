// lib/ble_provider.dart

import 'dart:async';
import 'dart:collection';
import 'package:flutter/material.dart';
import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';

class BleProvider with ChangeNotifier {
  // Initialize FlutterReactiveBle instance
  final FlutterReactiveBle _ble = FlutterReactiveBle();

  // Device information
  DiscoveredDevice? _device;
  QualifiedCharacteristic? _writeCharacteristic;
  QualifiedCharacteristic? _notifyCharacteristic;

  // Connection status
  String _status = "Disconnected";
  String get status => _status;

  // Error message
  String _errorMessage = "";
  String get errorMessage => _errorMessage;

  // Real-time data from command 0x41 (fuel data)
  // Store raw values in their natural units:
  // - Ethanol content: a percentage (e.g., 50 for 50%)
  // - Fuel temperature: in Celsius
  // - Fuel pressure: in PSI
  double ethanolContent = 0.0;
  double fuelTemp = 0.0;      // in Celsius
  double fuelPressure = 0.0;  // in PSI
  String firmwareVersion = 'Unknown';

  // Extended real-time data from command 0x42 (new request)
  // The protocol for 0x42 is:
  //   [0x42, rpmHigh, rpmLow, speed, waterTemp, oilTemp, gear, torqueHigh, torqueLow]
  // where:
  //   - rpm is a 16-bit integer (raw RPM)
  //   - speed is in KM/H (raw)
  //   - waterTemp and oilTemp are in Celsius (raw)
  //   - gear is an integer value
  //   - torque is a 16-bit integer in NM (raw)
  int rpm = 0;
  double speed = 0.0;         // in KM/H
  double coolantTemp = 0.0;   // in Celsius
  double oilTemp = 0.0;       // in Celsius
  int gear = 0;
  double torque = 0.0;        // in NM

  // Settings (as previously implemented)
  String selectedCanbusOutput = '0';
  String selectedAnalogOutput = '0';
  String selectedPressureReading = '0';
  List<int> calibrationValues = [25, 50, 75];

  // BLE Characteristics UUIDs
  final Uuid _serviceUuid = Uuid.parse("0000FFE0-0000-1000-8000-00805F9B34FB");
  final Uuid _writeUuid   = Uuid.parse("0000FFE9-0000-1000-8000-00805F9B34FB");
  final Uuid _notifyUuid  = Uuid.parse("0000FFE4-0000-1000-8000-00805F9B34FB");

  // Timer for real-time data updates
  Timer? _dataRequestTimer;

  // Logs for debugging
  final List<String> logs = [];

  // Retry configuration
  final int _maxRetries = 3;

  // Completer for awaiting command responses
  Completer<bool>? _commandCompleter;
  int _expectedResponseCode = 0;

  // BLE subscriptions
  StreamSubscription<DiscoveredDevice>? _scanSubscription;
  StreamSubscription<ConnectionStateUpdate>? _connectionSubscription;
  StreamSubscription<List<int>>? _notifySubscription;

  // Command queue for sequential command execution
  final Queue<Function> _commandQueue = Queue<Function>();
  bool _isProcessingQueue = false;

  // Flag to pause/resume data requests
  bool _isPaused = false;

  //────────────────────────────────────────────────────────────────────────────
  /// Adds a log message with a timestamp
  void addLogMessage(String message) {
    final timestamp = DateTime.now().toIso8601String();
    logs.add("[$timestamp] $message");
    if (logs.length > 1000) {
      logs.removeAt(0);
    }
    notifyListeners();
  }

  /// Logs byte data in hexadecimal format
  void logBytes(String message, List<int> bytes) {
    final byteString = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ');
    addLogMessage("$message: [Bytes: $byteString]");
  }

  /// Sets an error message and logs it
  void setErrorMessage(String message) {
    _errorMessage = message;
    addLogMessage("ERROR: $message");
    notifyListeners();
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Initiates scanning for the CANFLEX device and attempts to connect
  Future<void> scanAndConnect() async {
    _status = "Scanning for CANFLEX...";
    notifyListeners();
    addLogMessage("Started scanning for CANFLEX...");
    try {
      _scanSubscription = _ble.scanForDevices(
        withServices: [],
        scanMode: ScanMode.lowLatency,
      ).listen((device) {
        addLogMessage("Discovered device: ${device.name} (${device.id})");
        if (device.name == "CANFLEX") {
          _device = device;
          _status = "Device Found. Connecting...";
          notifyListeners();
          addLogMessage("Found CANFLEX device. Attempting to connect...");
          _connectToDevice();
          _scanSubscription?.cancel();
        }
      }, onError: (error) {
        setErrorMessage("Error during scan: $error");
        _status = "Scan Failed";
        notifyListeners();
      });
    } catch (e) {
      setErrorMessage("Error initiating scan: $e");
      _status = "Failed";
      notifyListeners();
    }
  }

  /// Connects to the discovered CANFLEX device
  Future<void> _connectToDevice() async {
    if (_device == null) {
      setErrorMessage("No device to connect to.");
      return;
    }
    try {
      _connectionSubscription = _ble.connectToDevice(
        id: _device!.id,
        connectionTimeout: const Duration(seconds: 10),
      ).listen((connectionState) {
        switch (connectionState.connectionState) {
          case DeviceConnectionState.connected:
            _status = "Connected";
            notifyListeners();
            addLogMessage("Connected to CANFLEX.");
            _discoverServices();
            break;
          case DeviceConnectionState.disconnected:
            _status = "Disconnected";
            notifyListeners();
            addLogMessage("Disconnected from CANFLEX.");
            _dataRequestTimer?.cancel();
            _notifySubscription?.cancel();
            break;
          case DeviceConnectionState.connecting:
            _status = "Connecting...";
            notifyListeners();
            addLogMessage("Connecting to CANFLEX...");
            break;
          case DeviceConnectionState.disconnecting:
            _status = "Disconnecting...";
            notifyListeners();
            addLogMessage("Disconnecting from CANFLEX...");
            break;
        }
      }, onError: (error) {
        setErrorMessage("Connection error: $error");
        _status = "Connection Failed";
        notifyListeners();
      });
    } catch (e) {
      setErrorMessage("Connection failed: $e");
      _status = "Failed";
      notifyListeners();
    }
  }

  /// Discovers services and sets up characteristics
  Future<void> _discoverServices() async {
    if (_device == null) {
      setErrorMessage("No device connected for service discovery.");
      return;
    }
    try {
      addLogMessage("Discovering services for CANFLEX...");
      final services = await _ble.discoverServices(_device!.id);
      for (var service in services) {
        addLogMessage("Service found: ${service.serviceId}");
        for (var characteristic in service.characteristics) {
          addLogMessage("Characteristic found: ${characteristic.characteristicId}");
        }
      }
      _setUpCharacteristics(services);
    } catch (e) {
      setErrorMessage("Error discovering services: $e");
    }
  }

  /// Sets up BLE characteristics for communication
  void _setUpCharacteristics(List<DiscoveredService> services) {
    try {
      final service = services.firstWhere(
        (svc) => svc.serviceId == _serviceUuid,
        orElse: () => throw Exception("Service $_serviceUuid not found"),
      );
      final writeChar = service.characteristics.firstWhere(
        (char) => char.characteristicId == _writeUuid,
        orElse: () => throw Exception("Write Characteristic $_writeUuid not found"),
      );
      final notifyChar = service.characteristics.firstWhere(
        (char) => char.characteristicId == _notifyUuid,
        orElse: () => throw Exception("Notify Characteristic $_notifyUuid not found"),
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
      addLogMessage("Successfully set up characteristics for CANFLEX.");
      _notifySubscription = _ble
          .subscribeToCharacteristic(_notifyCharacteristic!)
          .listen(_handleNotification, onError: (error) {
        setErrorMessage("Error receiving data: $error");
      });
      _startDataRequests();
    } catch (e) {
      setErrorMessage("Error setting up characteristics: $e");
    }
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Starts real-time data requests every 200ms.
  /// It sends both command 0x41 (fuel data) and 0x42 (extended data).
  void _startDataRequests() {
    _dataRequestTimer?.cancel();
    _dataRequestTimer = Timer.periodic(const Duration(milliseconds: 200), (timer) async {
      if (_status == "Connected" && !_isPaused) {
        // Send command 0x41 for fuel data
        try {
          addLogMessage("Initiating data request (0x41).");
          await _sendCommandAndWaitForResponse(
            [0x41, 0x0D, 0x0A, 0x00],
            expectedResponseCode: 0x41,
          );
        } catch (e) {
          setErrorMessage("Error requesting data (0x41): $e");
        }
        // Send command 0x42 for extended data (rpm, speed, coolant, oil, gear, torque)
        try {
          addLogMessage("Initiating data request (0x42).");
          await _sendCommandAndWaitForResponse(
            [0x42, 0x0D, 0x0A, 0x00],
            expectedResponseCode: 0x42,
          );
        } catch (e) {
          setErrorMessage("Error requesting data (0x42): $e");
        }
      } else {
        timer.cancel();
        addLogMessage("Real-time data requests stopped.");
      }
    });
    addLogMessage("Started real-time data requests.");
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Pauses real-time data requests.
  Future<void> pauseDataRequests() async {
    if (_dataRequestTimer != null && _dataRequestTimer!.isActive) {
      _dataRequestTimer?.cancel();
      _isPaused = true;
      addLogMessage("Paused real-time data requests.");
      notifyListeners();
    }
  }

  /// Resumes real-time data requests.
  Future<void> resumeDataRequests() async {
    if (_status == "Connected" && _isPaused) {
      _isPaused = false;
      _startDataRequests();
      addLogMessage("Resumed real-time data requests.");
      notifyListeners();
    }
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Handles incoming notifications from the device.
  /// If a command response is expected (via _commandCompleter), the data is parsed
  /// and the completer is completed. Otherwise, if the command is 0x41 or 0x42,
  /// the data is parsed anyway.
  void _handleNotification(List<int> data) {
    if (data.isEmpty) {
      addLogMessage("Empty notification => ignoring");
      return;
    }
    final cmd = data[0];
    logBytes("Notification", data);
    if (_commandCompleter != null && cmd == _expectedResponseCode) {
      addLogMessage("Got expected cmd=0x${cmd.toRadixString(16)} => completing future.");
      _parseData(cmd, data);
      _commandCompleter?.complete(true);
      _commandCompleter = null;
      return;
    }
    if ((cmd == 0x41 || cmd == 0x42) && data.length >= 4) {
      addLogMessage("Received 0x${cmd.toRadixString(16)} data => parsing anyway.");
      _parseData(cmd, data);
      return;
    }
    addLogMessage("Ignoring 0x${cmd.toRadixString(16)} => not handled or not expected.");
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Parses the received data.
  /// For 0x41: [0x41, ethanol%, fuelTemp, fuelPressure]
  /// For 0x42: [0x42, rpmHi, rpmLo, speed, waterTemp, oilTemp, gear, torqueHi, torqueLo]
  /// In this version, the raw numeric values are stored without conversion.
  void _parseData(int cmd, List<int> raw) {
    if (cmd == 0x41 && raw.length >= 4) {
      // Fuel data from 0x41
      // Byte1: Ethanol percentage (raw)
      // Byte2: Fuel temperature in Celsius (raw)
      // Byte3: Fuel pressure in PSI (raw)
      ethanolContent = raw[1].toDouble();
      fuelTemp = raw[2].toDouble();
      fuelPressure = raw[3].toDouble();
      notifyListeners();
    } else if (cmd == 0x42 && raw.length >= 9) {
      // Extended data from 0x42:
      // Byte1 & Byte2: RPM (int16)
      // Byte3: Speed in KM/H (raw)
      // Byte4: Water (coolant) temperature in Celsius (raw)
      // Byte5: Oil temperature in Celsius (raw)
      // Byte6: Gear (raw)
      // Byte7 & Byte8: Torque in NM (int16)
      rpm = (raw[1] << 8) | raw[2];
      speed = raw[3].toDouble();
      coolantTemp = raw[4].toDouble();
      oilTemp = raw[5].toDouble();
      gear = raw[6];
      torque = ((raw[7] << 8) | raw[8]).toDouble();
      notifyListeners();
    }
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Fetches all settings from the device.
  /// The commands for settings are sent sequentially.
  Future<bool> fetchDeviceSettings() async {
    return await _enqueueCommand<bool>(() async {
      pauseDataRequests();
      List<List<int>> commands = [
        [0x50, 0x0D, 0x0A, 0x00], // CANbus setting
        [0x51, 0x0D, 0x0A, 0x00], // Analog output
        [0x52, 0x0D, 0x0A, 0x00], // Sensor Calibration
        [0x53, 0x0D, 0x0A, 0x00], // Pressure Reading
        [0x21, 0x0D, 0x0A, 0x00], // Firmware Version
      ];
      for (var command in commands) {
        bool success = await _sendCommandAndWaitForResponse(
          command,
          expectedResponseCode: command[0],
        ).timeout(const Duration(seconds: 3), onTimeout: () {
          addLogMessage("Timeout for command ${command[0]}");
          return false;
        });
        if (!success) {
          setErrorMessage("Failed to fetch setting: Command ${command[0]} timed out.");
          return false;
        }
        await Future.delayed(const Duration(milliseconds: 100));
      }
      addLogMessage("Successfully fetched all settings from device.");
      return true;
    });
  }

  /// Saves settings to the device.
  Future<void> saveSettings(List<List<int>> commands) async {
    await _enqueueCommand<void>(() async {
      pauseDataRequests();
      for (var command in commands) {
        bool success = await _sendCommandAndWaitForResponse(
          command,
          expectedResponseCode: command[0],
        ).timeout(const Duration(seconds: 3), onTimeout: () {
          addLogMessage("Timeout for command ${command[0]}");
          return false;
        });
        if (!success) {
          setErrorMessage("Failed to save setting: Command ${command[0]} timed out.");
          throw Exception("Save settings failed.");
        }
        await Future.delayed(const Duration(milliseconds: 100));
      }
      addLogMessage("Successfully saved settings to device.");
    });
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Sends a command and waits for the expected response.
  Future<bool> _sendCommandAndWaitForResponse(
    List<int> command, {
    required int expectedResponseCode,
    int retries = 0,
  }) async {
    if (_writeCharacteristic == null) {
      setErrorMessage("Write characteristic is not initialized.");
      return false;
    }
    if (_commandCompleter != null && !_commandCompleter!.isCompleted) {
      setErrorMessage("Another command is being processed. Please wait.");
      return false;
    }
    _commandCompleter = Completer<bool>();
    _expectedResponseCode = expectedResponseCode;
    try {
      await _ble.writeCharacteristicWithoutResponse(
        _writeCharacteristic!,
        value: command,
      );
      logBytes("Sent command", command);
      addLogMessage("Sent command ${command[0]}: $command");
      bool success = await _commandCompleter!.future.timeout(
        const Duration(seconds: 2),
        onTimeout: () {
          addLogMessage("Timeout waiting for cmd ${command[0]}");
          return false;
        },
      );
      if (!success && retries < _maxRetries) {
        addLogMessage("Retrying command ${command[0]}, attempt ${retries + 1}");
        await Future.delayed(const Duration(milliseconds: 200));
        return _sendCommandAndWaitForResponse(
          command,
          expectedResponseCode: expectedResponseCode,
          retries: retries + 1,
        );
      }
      return success;
    } catch (e) {
      setErrorMessage("Error sending command ${command[0]}: $e");
      return false;
    } finally {
      _commandCompleter = null;
    }
  }

  //────────────────────────────────────────────────────────────────────────────
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

  //────────────────────────────────────────────────────────────────────────────
  /// Disconnects from the BLE device.
  Future<void> disconnect() async {
    try {
      await _connectionSubscription?.cancel();
      await _notifySubscription?.cancel();
      _ble.deinitialize();
      _status = "Disconnected";
      notifyListeners();
      addLogMessage("Disconnected from CANFLEX.");
    } catch (e) {
      setErrorMessage("Error during disconnection: $e");
    }
  }

  //────────────────────────────────────────────────────────────────────────────
  /// Disposes all resources.
  @override
  void dispose() {
    _dataRequestTimer?.cancel();
    _notifySubscription?.cancel();
    _connectionSubscription?.cancel();
    _scanSubscription?.cancel();
    _ble.deinitialize();
    super.dispose();
  }
}
