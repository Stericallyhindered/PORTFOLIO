import 'package:flutter/foundation.dart';

import '../models/tuning_map.dart';

class TuningService extends ChangeNotifier {
  TuningService() : _modes = _buildDefaultModes() {
    _selectedMapId = selectedMode.maps.first.id;
  }

  final Map<TuningModeId, TuningModeCalibration> _modes;
  TuningModeId _selectedModeId = TuningModeId.street;
  late String _selectedMapId;
  int _selectedRow = 0;
  int _selectedColumn = 0;

  List<TuningModeCalibration> get modes => _modes.values.toList();
  TuningModeId get selectedModeId => _selectedModeId;
  TuningModeCalibration get selectedMode => _modes[_selectedModeId]!;
  TuningMap get selectedMap => selectedMode.mapById(_selectedMapId);
  int get selectedRow => _selectedRow;
  int get selectedColumn => _selectedColumn;
  double get selectedValue => selectedMap.valueAt(_selectedRow, _selectedColumn);

  void selectMode(TuningModeId modeId) {
    _selectedModeId = modeId;
    if (!selectedMode.maps.any((map) => map.id == _selectedMapId)) {
      _selectedMapId = selectedMode.maps.first.id;
      _selectedRow = 0;
      _selectedColumn = 0;
    }
    notifyListeners();
  }

  void selectMap(String mapId) {
    _selectedMapId = mapId;
    _selectedRow = 0;
    _selectedColumn = 0;
    notifyListeners();
  }

  void selectCell(int row, int column) {
    _selectedRow = row;
    _selectedColumn = column;
    notifyListeners();
  }

  void updateSelectedCell(double value) {
    final updatedMap = selectedMap.updateCell(
      _selectedRow,
      _selectedColumn,
      value,
    );
    _modes[_selectedModeId] = selectedMode.updateMap(updatedMap);
    notifyListeners();
  }

  void updateDragLaunch(DragLaunchConfig config) {
    _modes[_selectedModeId] = selectedMode.updateDragLaunch(config);
    notifyListeners();
  }

  static Map<TuningModeId, TuningModeCalibration> _buildDefaultModes() {
    return <TuningModeId, TuningModeCalibration>{
      for (final modeId in TuningModeId.values)
        modeId: TuningModeCalibration(
          id: modeId,
          description: _descriptionForMode(modeId),
          maps: _mapsForMode(modeId),
          dragLaunch: _dragLaunchForMode(modeId),
        ),
    };
  }

  static String _descriptionForMode(TuningModeId modeId) {
    switch (modeId) {
      case TuningModeId.street:
        return 'Balanced street preload, conservative slip response, strong steering protection.';
      case TuningModeId.rain:
        return 'Earlier AWD engagement with smoother torque spike control.';
      case TuningModeId.sport:
        return 'Higher preload, faster slip response, and lighter steering clamp.';
      case TuningModeId.dragLaunch:
        return 'Launch-focused AWD with timer-based ramp-out to reduce driveline losses.';
      case TuningModeId.drift:
        return 'Delayed front engagement with relaxed steering clamp and strong handbrake behavior.';
      case TuningModeId.dynoService:
        return 'Service mode for dyno/testing with AWD disabled or hard-capped.';
    }
  }

  static List<TuningMap> _mapsForMode(TuningModeId modeId) {
    final scale = _modeScale(modeId);
    return <TuningMap>[
      _map(
        id: 'preload_load',
        name: 'Base Preload',
        description: 'Predictive part of final AWD request. Tuned from real wheel torque by gear before slip exists.',
        xAxis: _axis('wheel_torque_nm', 'Wheel Torque', 'Nm', <double>[
          0,
          100,
          200,
          300,
          400,
          500,
          650,
          800,
          1000,
          1200,
        ]),
        yAxis: _axis('gear_current', 'Gear', '', <double>[1, 2, 3, 4, 5, 6, 7, 8]),
        maxValue: 60,
        blendMode: TuningBlendMode.max,
        generator: (row, column) => (column + 1) * (9 - row) * 0.9 * scale,
      ),
      _map(
        id: 'slip_response',
        name: 'Slip Response',
        description: 'Reactive add into final AWD request. Tunes how hard AWD comes in only after rear slip exists.',
        xAxis: _axis('front_axle_speed_kph', 'Front Speed', 'kph', <double>[
          0,
          5,
          10,
          20,
          40,
          60,
          80,
          100,
          130,
          160,
        ]),
        yAxis: _axis('rear_slip_pct', 'Rear Slip', '%', <double>[
          0,
          0.5,
          1,
          2,
          3,
          5,
          8,
          12,
          18,
        ]),
        maxValue: 80,
        blendMode: TuningBlendMode.add,
        generator: (row, column) => row == 0 ? 0 : (row * 5 + column * 0.9) * scale,
      ),
      _map(
        id: 'shift_behavior',
        name: 'Shift Correction',
        description: 'Conditional correction during active shifts and torque reduction. Adds or removes from final request.',
        xAxis: _axis('gear_current', 'Current', '', <double>[1, 2, 3, 4, 5, 6, 7, 8]),
        yAxis: _axis('gear_target', 'Target', '', <double>[1, 2, 3, 4, 5, 6, 7, 8]),
        minValue: -30,
        maxValue: 30,
        blendMode: TuningBlendMode.add,
        generator: (row, column) => row == column ? 0 : (column - row) * 3 * scale,
      ),
      _map(
        id: 'driveline_coupling',
        name: 'Coupling Mult',
        description: 'Multiplier on final request based on lockup quality and converter slip.',
        xAxis: _axis('lockup_pct', 'Lockup', '%', <double>[0, 20, 40, 60, 75, 85, 95, 100]),
        yAxis: _axis('converter_slip_pct', 'Conv Slip', '%', <double>[0, 2, 5, 10, 15, 25, 40, 60]),
        minValue: 0.5,
        maxValue: 1.3,
        valueLabel: 'Multiplier',
        valueUnit: 'x',
        blendMode: TuningBlendMode.multiply,
        generator: (row, column) => (0.75 + column * 0.08 - row * 0.04).clamp(0.2, 1.5),
      ),
      _map(
        id: 'clutch_shaft_slip',
        name: 'Shaft Slip Corr',
        description: 'Correction from input/output shaft delta and clutch slip. Adds/removes AWD request.',
        xAxis: _axis('input_output_rpm_delta', 'Shaft Delta', 'rpm', <double>[0, 100, 200, 350, 500, 750, 1000, 1500]),
        yAxis: _axis('clutch_slip_pct', 'Clutch Slip', '%', <double>[0, 1, 2, 5, 8, 12, 18, 30]),
        minValue: -30,
        maxValue: 30,
        blendMode: TuningBlendMode.add,
        generator: (row, column) => (row * 2.5 + column * 1.2) * scale,
      ),
      _map(
        id: 'steering_limit',
        name: 'Steering Limit',
        description: 'Clamp on final request. Prevents binding at steering angle and speed.',
        xAxis: _axis('vehicle_speed_kph', 'Speed', 'kph', <double>[0, 5, 10, 20, 40, 60, 90, 130]),
        yAxis: _axis('abs_steering_angle', 'Steering', 'deg', <double>[0, 3, 6, 10, 15, 22, 30, 45]),
        maxValue: 100,
        blendMode: TuningBlendMode.clamp,
        generator:
            (row, column) =>
                (100 - row * 13 + column * 3).clamp(0, 100).toDouble(),
      ),
      _map(
        id: 'launch_low_speed',
        name: 'Launch Preload',
        description: 'Low-speed launch preload contribution before slip response reacts.',
        xAxis: _axis('engine_rpm', 'RPM', 'rpm', <double>[1000, 1500, 2000, 2500, 3200, 4000, 5000, 6500]),
        yAxis: _axis('wheel_torque_nm', 'Torque', 'Nm', <double>[0, 150, 300, 450, 600, 800, 1000, 1200]),
        maxValue: 100,
        blendMode: TuningBlendMode.max,
        generator: (row, column) => (row * 5 + column * 4) * _launchScale(modeId),
      ),
      _map(
        id: 'mode_program',
        name: 'Program Mult',
        description: 'Multiplier from TurboLamik gearbox mode/program into final request personality.',
        xAxis: _axis('gearbox_mode', 'Gearbox Mode', '', <double>[0, 1, 2]),
        yAxis: _axis('gearbox_program', 'Program', '', <double>[1, 2, 3, 4, 5, 6]),
        minValue: 0,
        maxValue: 1.5,
        valueLabel: 'Multiplier',
        valueUnit: 'x',
        blendMode: TuningBlendMode.multiply,
        generator: (row, column) => (0.85 + row * 0.1 + column * 0.04).clamp(0, 1.5),
      ),
    ];
  }

  static TuningAxis _axis(String signal, String label, String unit, List<double> values) {
    return TuningAxis(signal: signal, label: label, unit: unit, values: values);
  }

  static TuningMap _map({
    required String id,
    required String name,
    required String description,
    required TuningAxis xAxis,
    required TuningAxis yAxis,
    required TuningBlendMode blendMode,
    required double Function(int row, int column) generator,
    double minValue = 0,
    double maxValue = 100,
    String valueLabel = 'AWD',
    String valueUnit = '%',
  }) {
    return TuningMap(
      id: id,
      name: name,
      description: description,
      xAxis: xAxis,
      yAxis: yAxis,
      valueLabel: valueLabel,
      valueUnit: valueUnit,
      minValue: minValue,
      maxValue: maxValue,
      blendMode: blendMode,
      values: <List<double>>[
        for (var row = 0; row < yAxis.values.length; row++)
          <double>[
            for (var column = 0; column < xAxis.values.length; column++)
              generator(row, column).clamp(minValue, maxValue).toDouble(),
          ],
      ],
    );
  }

  static double _modeScale(TuningModeId modeId) {
    switch (modeId) {
      case TuningModeId.street:
        return 0.75;
      case TuningModeId.rain:
        return 0.9;
      case TuningModeId.sport:
        return 1.1;
      case TuningModeId.dragLaunch:
        return 1.25;
      case TuningModeId.drift:
        return 0.45;
      case TuningModeId.dynoService:
        return 0;
    }
  }

  static double _launchScale(TuningModeId modeId) {
    switch (modeId) {
      case TuningModeId.dragLaunch:
        return 1.6;
      case TuningModeId.sport:
        return 0.9;
      case TuningModeId.rain:
        return 0.7;
      case TuningModeId.street:
        return 0.5;
      case TuningModeId.drift:
        return 0.2;
      case TuningModeId.dynoService:
        return 0;
    }
  }

  static DragLaunchConfig _dragLaunchForMode(TuningModeId modeId) {
    return DragLaunchConfig(
      enabled: modeId == TuningModeId.dragLaunch,
      launchAwdPct: modeId == TuningModeId.dragLaunch ? 100 : 0,
      holdSeconds: modeId == TuningModeId.dragLaunch ? 2.0 : 0,
      rampOutSeconds: modeId == TuningModeId.dragLaunch ? 0.35 : 0,
      afterTimerAwdPct: 0,
      triggerMinWheelTorqueNm: 350,
      triggerMinEngineRpm: 2500,
      triggerSpeedKph: 2,
      maxSteeringAngleDeg: 8,
    );
  }
}
