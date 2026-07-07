enum TuningBlendMode { add, multiply, max, clamp }

enum TuningModeId { street, rain, sport, dragLaunch, drift, dynoService }

extension TuningModeIdLabel on TuningModeId {
  String get label {
    switch (this) {
      case TuningModeId.street:
        return 'Street';
      case TuningModeId.rain:
        return 'Rain';
      case TuningModeId.sport:
        return 'Sport';
      case TuningModeId.dragLaunch:
        return 'Drag / Launch';
      case TuningModeId.drift:
        return 'Drift';
      case TuningModeId.dynoService:
        return 'Dyno / Service';
    }
  }
}

class TuningAxis {
  const TuningAxis({
    required this.signal,
    required this.label,
    required this.unit,
    required this.values,
  });

  final String signal;
  final String label;
  final String unit;
  final List<double> values;
}

class TuningMap {
  const TuningMap({
    required this.id,
    required this.name,
    required this.description,
    required this.xAxis,
    required this.yAxis,
    required this.valueLabel,
    required this.valueUnit,
    required this.minValue,
    required this.maxValue,
    required this.blendMode,
    required this.values,
  });

  final String id;
  final String name;
  final String description;
  final TuningAxis xAxis;
  final TuningAxis yAxis;
  final String valueLabel;
  final String valueUnit;
  final double minValue;
  final double maxValue;
  final TuningBlendMode blendMode;
  final List<List<double>> values;

  double valueAt(int row, int column) => values[row][column];

  TuningMap copyWith({
    String? id,
    String? name,
    String? description,
    TuningAxis? xAxis,
    TuningAxis? yAxis,
    String? valueLabel,
    String? valueUnit,
    double? minValue,
    double? maxValue,
    TuningBlendMode? blendMode,
    List<List<double>>? values,
  }) {
    return TuningMap(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      xAxis: xAxis ?? this.xAxis,
      yAxis: yAxis ?? this.yAxis,
      valueLabel: valueLabel ?? this.valueLabel,
      valueUnit: valueUnit ?? this.valueUnit,
      minValue: minValue ?? this.minValue,
      maxValue: maxValue ?? this.maxValue,
      blendMode: blendMode ?? this.blendMode,
      values: values ?? this.values,
    );
  }

  TuningMap updateCell(int row, int column, double value) {
    final nextRows = values.map((rowValues) => List<double>.from(rowValues)).toList();
    nextRows[row][column] = value.clamp(minValue, maxValue).toDouble();
    return copyWith(values: nextRows);
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'description': description,
      'xAxis': <String, dynamic>{
        'signal': xAxis.signal,
        'label': xAxis.label,
        'unit': xAxis.unit,
        'values': xAxis.values,
      },
      'yAxis': <String, dynamic>{
        'signal': yAxis.signal,
        'label': yAxis.label,
        'unit': yAxis.unit,
        'values': yAxis.values,
      },
      'valueLabel': valueLabel,
      'valueUnit': valueUnit,
      'minValue': minValue,
      'maxValue': maxValue,
      'blendMode': blendMode.name,
      'values': values,
    };
  }
}

class DragLaunchConfig {
  const DragLaunchConfig({
    required this.enabled,
    required this.launchAwdPct,
    required this.holdSeconds,
    required this.rampOutSeconds,
    required this.afterTimerAwdPct,
    required this.triggerMinWheelTorqueNm,
    required this.triggerMinEngineRpm,
    required this.triggerSpeedKph,
    required this.maxSteeringAngleDeg,
  });

  final bool enabled;
  final double launchAwdPct;
  final double holdSeconds;
  final double rampOutSeconds;
  final double afterTimerAwdPct;
  final double triggerMinWheelTorqueNm;
  final double triggerMinEngineRpm;
  final double triggerSpeedKph;
  final double maxSteeringAngleDeg;

  DragLaunchConfig copyWith({
    bool? enabled,
    double? launchAwdPct,
    double? holdSeconds,
    double? rampOutSeconds,
    double? afterTimerAwdPct,
    double? triggerMinWheelTorqueNm,
    double? triggerMinEngineRpm,
    double? triggerSpeedKph,
    double? maxSteeringAngleDeg,
  }) {
    return DragLaunchConfig(
      enabled: enabled ?? this.enabled,
      launchAwdPct: launchAwdPct ?? this.launchAwdPct,
      holdSeconds: holdSeconds ?? this.holdSeconds,
      rampOutSeconds: rampOutSeconds ?? this.rampOutSeconds,
      afterTimerAwdPct: afterTimerAwdPct ?? this.afterTimerAwdPct,
      triggerMinWheelTorqueNm:
          triggerMinWheelTorqueNm ?? this.triggerMinWheelTorqueNm,
      triggerMinEngineRpm: triggerMinEngineRpm ?? this.triggerMinEngineRpm,
      triggerSpeedKph: triggerSpeedKph ?? this.triggerSpeedKph,
      maxSteeringAngleDeg: maxSteeringAngleDeg ?? this.maxSteeringAngleDeg,
    );
  }
}

class TuningModeCalibration {
  const TuningModeCalibration({
    required this.id,
    required this.description,
    required this.maps,
    required this.dragLaunch,
  });

  final TuningModeId id;
  final String description;
  final List<TuningMap> maps;
  final DragLaunchConfig dragLaunch;

  TuningMap mapById(String mapId) =>
      maps.firstWhere((map) => map.id == mapId, orElse: () => maps.first);

  TuningModeCalibration updateMap(TuningMap updatedMap) {
    return TuningModeCalibration(
      id: id,
      description: description,
      maps:
          maps
              .map((map) => map.id == updatedMap.id ? updatedMap : map)
              .toList(),
      dragLaunch: dragLaunch,
    );
  }

  TuningModeCalibration updateDragLaunch(DragLaunchConfig updatedConfig) {
    return TuningModeCalibration(
      id: id,
      description: description,
      maps: maps,
      dragLaunch: updatedConfig,
    );
  }
}
