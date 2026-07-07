import 'dart:async';
import 'dart:math';

import '../models/capture_control.dart';
import '../models/health_status.dart';
import '../models/live_snapshot.dart';
import '../models/raw_can_frame.dart';
import '../models/saved_capture.dart';
import '../models/vehicle_profile.dart';
import 'telemetry_service.dart';

class DemoTelemetryService extends TelemetryService {
  DemoTelemetryService()
    : profile = const VehicleProfile(
        id: 'e90_turbolamik_phase1',
        displayName: 'BMW E90 AWD + TurboLamik Phase 1',
        busBitrate: 500000,
        sharedBus: true,
        supportsYawRate: false,
        watchedIds: <int>[
          0x0AA,
          0x0CE,
          0x0C8,
          0x19E,
          0x1A6,
          0x1B4,
          0x34F,
          0x130,
          0x24A,
          0x3B0,
          0x720,
          0x721,
          0x722,
          0x723,
        ],
        requiredSignals: <String>[
          'engine_rpm',
          'throttle_pct',
          'wheel_speed_fl',
          'wheel_speed_fr',
          'wheel_speed_rl',
          'wheel_speed_rr',
          'vehicle_speed',
          'steering_angle',
          'brake_active',
          'handbrake_active',
          'reverse_active',
          'gear_current',
          'gear_target',
          'gearbox_mode',
          'gearbox_program',
          'lockup_pct',
          'wheel_torque_nm',
          'torque_reduction_pct',
          'torque_reduction_active',
          'shift_active',
          'input_shaft_rpm',
          'output_shaft_rpm',
          'clutch_slip_pct',
          'converter_slip_pct',
          'gearbox_oil_temp_c',
        ],
        optionalSignals: <String>[
          'yaw_rate',
          'brake_pressure_proxy',
          'wheel_torque_correlation',
        ],
        notes: <String>[
          'Single shared 500 kbps CAN bus.',
          'TurboLamik TCU V2 TX stream base ID 0x720.',
          'Yaw rate reserved for future E90 profile refinement.',
          'Phase 1 is passive decode, BLE telemetry, and capture only.',
        ],
      ),
      snapshot = _initialSnapshot(),
      health = const HealthStatus(
        bleConnected: true,
        captureActive: false,
        busBitrate: 500000,
        uptime: Duration.zero,
        totalFrames: 0,
        decoderErrors: 0,
        staleSignals: <String>['yaw_rate'],
        frameRatesHz: <int, double>{
          0x0AA: 50,
          0x0CE: 50,
          0x0C8: 100,
          0x19E: 50,
          0x720: 100,
          0x721: 40,
          0x722: 20,
          0x723: 100,
        },
      ),
      captureControl = const CaptureControl(
        active: false,
        maxFrames: 512,
        filterMode: CaptureFilterMode.selectedProfile,
        bufferedFrames: 0,
      );

  @override
  final VehicleProfile profile;
  final Stopwatch _uptime = Stopwatch();
  final Random _random = Random(90);
  final List<RawCanFrame> _latestFrames = <RawCanFrame>[];
  final List<SavedCapture> _savedCaptures = <SavedCapture>[];
  final List<RawCanFrame> _captureFrames = <RawCanFrame>[];

  Timer? _ticker;
  int _tick = 0;

  @override
  LiveSnapshot snapshot;

  @override
  HealthStatus health;

  @override
  CaptureControl captureControl;

  @override
  List<RawCanFrame> get latestFrames =>
      List<RawCanFrame>.unmodifiable(_latestFrames.reversed);

  @override
  List<SavedCapture> get savedCaptures =>
      List<SavedCapture>.unmodifiable(_savedCaptures.reversed);
  @override
  bool get isDemoMode => true;

  @override
  String get modeLabel => 'Demo mode';

  @override
  void start() {
    if (_ticker != null) {
      return;
    }
    _uptime.start();
    _ticker = Timer.periodic(
      const Duration(milliseconds: 100),
      (_) => _onTick(),
    );
  }

  @override
  void shutdown() {
    _ticker?.cancel();
    _ticker = null;
    _uptime.stop();
    dispose();
  }

  @override
  void setCaptureFilter(CaptureFilterMode mode) {
    captureControl = captureControl.copyWith(filterMode: mode);
    notifyListeners();
  }

  @override
  void startCapture() {
    _captureFrames.clear();
    captureControl = captureControl.copyWith(active: true, bufferedFrames: 0);
    health = health.copyWith(captureActive: true);
    notifyListeners();
  }

  @override
  void stopCapture() {
    if (!captureControl.active) {
      return;
    }

    final label =
        captureControl.filterMode == CaptureFilterMode.selectedProfile
            ? 'Profile IDs'
            : 'Full bus';
    final capture = SavedCapture(
      name: 'Session ${_savedCaptures.length + 1}',
      createdAt: DateTime.now(),
      frames: List<RawCanFrame>.from(_captureFrames),
      filterModeLabel: label,
    );
    _savedCaptures.add(capture);
    _captureFrames.clear();
    captureControl = captureControl.copyWith(active: false, bufferedFrames: 0);
    health = health.copyWith(captureActive: false);
    notifyListeners();
  }

  @override
  void clearSavedCaptures() {
    _savedCaptures.clear();
    notifyListeners();
  }

  @override
  void deleteSavedCapture(SavedCapture capture) {
    _savedCaptures.remove(capture);
    notifyListeners();
  }

  void _onTick() {
    _tick += 1;
    final now = DateTime.now();
    final t = _tick / 10.0;

    final throttle =
        (12 + 52 * (0.5 + 0.5 * sin(t / 1.8)) + _random.nextDouble() * 6)
            .clamp(0, 100)
            .toDouble();
    final speed = (18 + 82 * (0.5 + 0.5 * sin(t / 5.2))).toDouble();
    final engineRpm = (1250 + throttle * 42 + speed * 24 + 180 * sin(t / 0.9))
        .clamp(900, 6800);
    final steering = 28 * sin(t / 2.4);
    final brakeProxy = max(0.0, 100 * sin((t - 4) / 3.6));
    final brakeActive = brakeProxy > 28;
    final handbrake = t % 42 > 39;
    final reverse = t % 58 > 56;
    final shiftActive = t % 14 > 13 || (t % 17 > 16.2 && t % 17 < 16.8);
    final torqueReduction =
        shiftActive ? (18 + 16 * (0.5 + 0.5 * sin(t * 2))) : 0.0;
    final gearCurrent = _gearForSpeed(speed);
    final gearTarget = shiftActive ? min(8, gearCurrent + 1) : gearCurrent;
    final lockup = (35 + speed * 0.6).clamp(8, 96).toDouble();
    final wheelTorque =
        (180 + throttle * 5.8 - speed * 0.8).clamp(80, 780).toDouble();
    const frontRearBias = 0.35;
    final frontAxleSpeed = speed - (shiftActive ? 0.6 : frontRearBias);
    final rearAxleSpeed =
        speed +
        (shiftActive ? 0.6 : frontRearBias) +
        max(0.0, throttle - 64) * 0.08;
    final wheelFl = frontAxleSpeed - steering.abs() * 0.012;
    final wheelFr = frontAxleSpeed + steering.abs() * 0.012;
    final wheelRl = rearAxleSpeed - steering.abs() * 0.009;
    final wheelRr = rearAxleSpeed + steering.abs() * 0.009;
    final inputShaft = max(engineRpm * (lockup / 100), speed * 34.0);
    final outputShaft = max(400.0, speed * 29.0);
    final clutchSlip = (rearAxleSpeed - frontAxleSpeed) * 1.8;
    final converterSlip = max(0.0, (100 - lockup) * 0.55);
    final gearboxOilTemp =
        (62 + speed * 0.28 + throttle * 0.1).clamp(55, 120).toDouble();

    final metrics = _buildMetrics(
      wheelFl: wheelFl,
      wheelFr: wheelFr,
      wheelRl: wheelRl,
      wheelRr: wheelRr,
      steering: steering,
      lockup: lockup,
      clutchSlip: clutchSlip,
      converterSlip: converterSlip,
      shiftActive: shiftActive,
      speed: speed,
    );
    final shadow = _buildShadow(
      throttle: throttle,
      shiftActive: shiftActive,
      brakeActive: brakeActive,
      handbrake: handbrake,
      reverse: reverse,
      oilTemp: gearboxOilTemp,
      steering: steering,
      speed: speed,
      rearSlipRatio: metrics.rearSlipRatio,
    );

    snapshot = LiveSnapshot(
      timestamp: now,
      engineRpm: engineRpm.toDouble(),
      throttlePct: throttle,
      wheelSpeedFlKph: wheelFl,
      wheelSpeedFrKph: wheelFr,
      wheelSpeedRlKph: wheelRl,
      wheelSpeedRrKph: wheelRr,
      vehicleSpeedKph: speed,
      steeringAngleDeg: steering,
      brakeActive: brakeActive,
      handbrakeActive: handbrake,
      reverseActive: reverse,
      gearCurrent: gearCurrent,
      gearTarget: gearTarget,
      gearboxMode: speed > 55 ? 2 : 1,
      gearboxProgram: speed > 70 ? 4 : 2,
      lockupPct: lockup,
      wheelTorqueNm: wheelTorque,
      torqueReductionPct: torqueReduction,
      torqueReductionActive: shiftActive,
      shiftActive: shiftActive,
      inputShaftRpm: inputShaft,
      outputShaftRpm: outputShaft,
      clutchSlipPct: clutchSlip,
      converterSlipPct: converterSlip,
      gearboxOilTempC: gearboxOilTemp,
      brakePressureProxy: brakeProxy,
      metrics: metrics,
      shadowOutput: shadow,
    );

    final frames = _buildFrames(snapshot);
    for (final frame in frames) {
      _latestFrames.add(frame);
      if (_latestFrames.length > 96) {
        _latestFrames.removeAt(0);
      }

      final shouldCapture =
          captureControl.filterMode == CaptureFilterMode.fullBus ||
          profile.watchedIds.contains(frame.id);
      if (captureControl.active && shouldCapture) {
        _captureFrames.add(frame);
        if (_captureFrames.length > captureControl.maxFrames) {
          _captureFrames.removeAt(0);
        }
      }
    }

    captureControl = captureControl.copyWith(
      bufferedFrames: _captureFrames.length,
    );
    health = health.copyWith(
      uptime: _uptime.elapsed,
      totalFrames: health.totalFrames + frames.length,
      captureActive: captureControl.active,
      staleSignals: const <String>['yaw_rate'],
    );

    notifyListeners();
  }

  DerivedMetrics _buildMetrics({
    required double wheelFl,
    required double wheelFr,
    required double wheelRl,
    required double wheelRr,
    required double steering,
    required double lockup,
    required double clutchSlip,
    required double converterSlip,
    required bool shiftActive,
    required double speed,
  }) {
    final frontAxle = (wheelFl + wheelFr) / 2;
    final rearAxle = (wheelRl + wheelRr) / 2;
    final reference = max(speed, 5.0);
    final frontRearDelta = rearAxle - frontAxle;

    return DerivedMetrics(
      frontAxleSpeedKph: frontAxle,
      rearAxleSpeedKph: rearAxle,
      frontRearSpeedDeltaKph: frontRearDelta,
      rearSlipRatio: frontRearDelta / reference,
      frontSlipRatio: -frontRearDelta / reference,
      leftRightDeltaFrontKph: wheelFr - wheelFl,
      leftRightDeltaRearKph: wheelRr - wheelRl,
      turningState:
          steering.abs() > 18
              ? 'Cornering'
              : speed < 8
              ? 'Parking'
              : 'Straight',
      drivetrainState:
          shiftActive
              ? 'Shift'
              : lockup > 78
              ? 'Locked'
              : converterSlip > 25 || clutchSlip > 10
              ? 'Slip-managed'
              : 'Coupling',
    );
  }

  AwdShadowOutput _buildShadow({
    required double throttle,
    required bool shiftActive,
    required bool brakeActive,
    required bool handbrake,
    required bool reverse,
    required double oilTemp,
    required double steering,
    required double speed,
    required double rearSlipRatio,
  }) {
    final basePrecharge = (throttle * 0.24).clamp(0, 34).toDouble();
    final shiftAdd = shiftActive ? 8.0 : 0.0;
    final slipAdd = (rearSlipRatio * 180).clamp(0, 26).toDouble();
    final steeringClamp = steering.abs() > 20 && speed < 30 ? 24.0 : 88.0;
    final brakeClamp = brakeActive ? 18.0 : 100.0;
    final tempClamp = oilTemp > 108 ? 16.0 : 100.0;
    final clampPct = min(steeringClamp, min(brakeClamp, tempClamp));

    var request = basePrecharge + shiftAdd + slipAdd;
    if (handbrake || reverse) {
      request = 0;
    }
    request = request.clamp(0, clampPct).toDouble();

    return AwdShadowOutput(
      awdRequestPct: request,
      basePrechargePct: basePrecharge,
      slipAddPct: slipAdd,
      shiftAddPct: shiftAdd,
      clampPct: clampPct,
      degraded: false,
    );
  }

  List<RawCanFrame> _buildFrames(LiveSnapshot live) {
    final now = live.timestamp;
    return <RawCanFrame>[
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x0AA,
        dlc: 8,
        data: _encode0x0AA(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x0CE,
        dlc: 8,
        data: _encode0x0CE(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x0C8,
        dlc: 6,
        data: _encode0x0C8(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x19E,
        dlc: 8,
        data: _encode0x19E(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x1B4,
        dlc: 8,
        data: _encode0x1B4(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x720,
        dlc: 8,
        data: _encode0x720(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x721,
        dlc: 8,
        data: _encode0x721(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x722,
        dlc: 8,
        data: _encode0x722(live),
      ),
      RawCanFrame(
        timestamp: now,
        bus: 'CAN1',
        id: 0x723,
        dlc: 8,
        data: _encode0x723(live),
      ),
    ];
  }

  List<int> _encode0x0AA(LiveSnapshot live) {
    final rpmRaw = (live.engineRpm * 4).round().clamp(0, 65535);
    final throttleRaw = (live.throttlePct / 0.39063).round().clamp(0, 255);
    return <int>[
      0x5F,
      0x59,
      0xFF,
      throttleRaw,
      rpmRaw & 0xFF,
      (rpmRaw >> 8) & 0xFF,
      0x80,
      0x99,
    ];
  }

  List<int> _encode0x0CE(LiveSnapshot live) {
    int pack(double value) => (value / 0.0625).round().clamp(0, 65535);

    final fl = pack(live.wheelSpeedFlKph);
    final fr = pack(live.wheelSpeedFrKph);
    final rl = pack(live.wheelSpeedRlKph);
    final rr = pack(live.wheelSpeedRrKph);

    return <int>[
      fl & 0xFF,
      (fl >> 8) & 0xFF,
      fr & 0xFF,
      (fr >> 8) & 0xFF,
      rl & 0xFF,
      (rl >> 8) & 0xFF,
      rr & 0xFF,
      (rr >> 8) & 0xFF,
    ];
  }

  List<int> _encode0x0C8(LiveSnapshot live) {
    final raw = (live.steeringAngleDeg / 0.1).round();
    final wrapped = raw & 0xFFFF;
    return <int>[wrapped & 0xFF, (wrapped >> 8) & 0xFF, 0xFC, 0x00, 0x00, 0xFF];
  }

  List<int> _encode0x19E(LiveSnapshot live) {
    final brake = (live.brakePressureProxy * 2.2).round().clamp(0, 255);
    return <int>[0x00, brake, brake, 0xFC, 0xF0, 0x43, 0x00, 0x65];
  }

  List<int> _encode0x1B4(LiveSnapshot live) {
    final mph = (live.vehicleSpeedKph * 0.621371).round().clamp(0, 255);
    return <int>[
      0x00,
      mph,
      0xE0,
      0xF8,
      0x00,
      0x32,
      0xFE,
      live.handbrakeActive ? 0x91 : 0x90,
    ];
  }

  List<int> _encode0x720(LiveSnapshot live) {
    final calculatedTorque = live.wheelTorqueNm.round().clamp(-32768, 32767);
    final targetTorque = (live.wheelTorqueNm *
            (1.0 - live.torqueReductionPct / 100))
        .round()
        .clamp(-32768, 32767);
    final tqReductionRaw = (live.torqueReductionPct / 0.5).round().clamp(
      0,
      255,
    );
    final flags =
        (live.torqueReductionActive ? 0x01 : 0x00) |
        (live.shiftActive ? 0x40 : 0x00);

    return <int>[
      (calculatedTorque >> 8) & 0xFF,
      calculatedTorque & 0xFF,
      (targetTorque >> 8) & 0xFF,
      targetTorque & 0xFF,
      tqReductionRaw,
      flags,
      0x00,
      0x00,
    ];
  }

  List<int> _encode0x721(LiveSnapshot live) {
    final wheelTorque = live.wheelTorqueNm.round().clamp(-32768, 32767);
    final flags =
        (live.handbrakeActive ? 0x04 : 0x00) |
        (live.brakeActive ? 0x08 : 0x00) |
        (live.lockupPct > 80 ? 0x20 : 0x00);

    return <int>[
      live.gearCurrent & 0xFF,
      live.gearTarget & 0xFF,
      flags,
      0x00,
      (wheelTorque >> 8) & 0xFF,
      wheelTorque & 0xFF,
      0x00,
      0x00,
    ];
  }

  List<int> _encode0x722(LiveSnapshot live) {
    final lockupRaw = (live.lockupPct / 0.4).round().clamp(0, 250);
    final tempRaw = (live.gearboxOilTempC + 40).round().clamp(0, 255);
    final speedRaw = live.vehicleSpeedKph.round().clamp(0, 65535);

    return <int>[
      live.gearboxProgram.clamp(1, 8),
      live.gearboxMode.clamp(0, 2),
      lockupRaw,
      tempRaw,
      (speedRaw >> 8) & 0xFF,
      speedRaw & 0xFF,
      0x00,
      0x00,
    ];
  }

  List<int> _encode0x723(LiveSnapshot live) {
    final clutch = live.clutchSlipPct.round().clamp(-32768, 32767);
    final converter = live.converterSlipPct.round().clamp(-32768, 32767);
    final input = live.inputShaftRpm.round().clamp(0, 65535);
    final output = live.outputShaftRpm.round().clamp(0, 65535);

    return <int>[
      (clutch >> 8) & 0xFF,
      clutch & 0xFF,
      (converter >> 8) & 0xFF,
      converter & 0xFF,
      (input >> 8) & 0xFF,
      input & 0xFF,
      (output >> 8) & 0xFF,
      output & 0xFF,
    ];
  }

  int _gearForSpeed(double speed) {
    if (speed < 12) {
      return 1;
    }
    if (speed < 24) {
      return 2;
    }
    if (speed < 38) {
      return 3;
    }
    if (speed < 52) {
      return 4;
    }
    if (speed < 68) {
      return 5;
    }
    if (speed < 86) {
      return 6;
    }
    if (speed < 108) {
      return 7;
    }
    return 8;
  }

  static LiveSnapshot _initialSnapshot() {
    return LiveSnapshot(
      timestamp: DateTime.fromMillisecondsSinceEpoch(0),
      engineRpm: 0,
      throttlePct: 0,
      wheelSpeedFlKph: 0,
      wheelSpeedFrKph: 0,
      wheelSpeedRlKph: 0,
      wheelSpeedRrKph: 0,
      vehicleSpeedKph: 0,
      steeringAngleDeg: 0,
      brakeActive: false,
      handbrakeActive: false,
      reverseActive: false,
      gearCurrent: 0,
      gearTarget: 0,
      gearboxMode: 0,
      gearboxProgram: 1,
      lockupPct: 0,
      wheelTorqueNm: 0,
      torqueReductionPct: 0,
      torqueReductionActive: false,
      shiftActive: false,
      inputShaftRpm: 0,
      outputShaftRpm: 0,
      clutchSlipPct: 0,
      converterSlipPct: 0,
      gearboxOilTempC: 0,
      brakePressureProxy: 0,
      metrics: DerivedMetrics(
        frontAxleSpeedKph: 0,
        rearAxleSpeedKph: 0,
        frontRearSpeedDeltaKph: 0,
        rearSlipRatio: 0,
        frontSlipRatio: 0,
        leftRightDeltaFrontKph: 0,
        leftRightDeltaRearKph: 0,
        turningState: 'Unknown',
        drivetrainState: 'Unknown',
      ),
      shadowOutput: AwdShadowOutput(
        awdRequestPct: 0,
        basePrechargePct: 0,
        slipAddPct: 0,
        shiftAddPct: 0,
        clampPct: 0,
        degraded: true,
      ),
    );
  }
}
