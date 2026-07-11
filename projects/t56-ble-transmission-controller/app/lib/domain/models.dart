import '../ble/uuids.dart';

class PwmChannelValues {
  const PwmChannelValues({
    required this.dutyPct,
    required this.periodMs,
    required this.vavg,
    required this.vrms,
    required this.vmax,
    required this.vmin,
  });

  final double dutyPct;
  final double periodMs;
  final double vavg;
  final double vrms;
  final double vmax;
  final double vmin;

  static const zero = PwmChannelValues(
    dutyPct: 0,
    periodMs: 4.0,
    vavg: 0,
    vrms: 0,
    vmax: 0,
    vmin: 0,
  );

  PwmChannelValues copyWith({
    double? dutyPct,
    double? periodMs,
    double? vavg,
    double? vrms,
    double? vmax,
    double? vmin,
  }) {
    return PwmChannelValues(
      dutyPct: dutyPct ?? this.dutyPct,
      periodMs: periodMs ?? this.periodMs,
      vavg: vavg ?? this.vavg,
      vrms: vrms ?? this.vrms,
      vmax: vmax ?? this.vmax,
      vmin: vmin ?? this.vmin,
    );
  }

  Map<String, dynamic> toJson() => {
        'dutyPct': dutyPct,
        'periodMs': periodMs,
        'vavg': vavg,
        'vrms': vrms,
        'vmax': vmax,
        'vmin': vmin,
      };

  factory PwmChannelValues.fromJson(Map<String, dynamic> json) {
    return PwmChannelValues(
      dutyPct: (json['dutyPct'] as num?)?.toDouble() ?? 0,
      periodMs: (json['periodMs'] as num?)?.toDouble() ?? 4.0,
      vavg: (json['vavg'] as num?)?.toDouble() ?? 0,
      vrms: (json['vrms'] as num?)?.toDouble() ?? 0,
      vmax: (json['vmax'] as num?)?.toDouble() ?? 0,
      vmin: (json['vmin'] as num?)?.toDouble() ?? 0,
    );
  }
}

class GearRow {
  const GearRow({
    required this.gear,
    required this.inputs,
    required this.outputs,
  });

  final String gear;
  final List<PwmChannelValues> inputs;
  final List<PwmChannelValues> outputs;

  GearRow copyWith({
    String? gear,
    List<PwmChannelValues>? inputs,
    List<PwmChannelValues>? outputs,
  }) {
    return GearRow(
      gear: gear ?? this.gear,
      inputs: inputs ?? List.from(this.inputs),
      outputs: outputs ?? List.from(this.outputs),
    );
  }

  Map<String, dynamic> toJson() => {
        'gear': gear,
        'inputs': inputs.map((e) => e.toJson()).toList(),
        'outputs': outputs.map((e) => e.toJson()).toList(),
      };

  factory GearRow.fromJson(Map<String, dynamic> json) {
    final rawIn = json['inputs'] as List<dynamic>? ?? const [];
    final rawOut = json['outputs'] as List<dynamic>? ?? const [];
    return GearRow(
      gear: json['gear'] as String? ?? 'Neutral',
      inputs: rawIn
          .map((e) => PwmChannelValues.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      outputs: rawOut
          .map((e) => PwmChannelValues.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

class GearMappingPreset {
  const GearMappingPreset({
    required this.id,
    required this.name,
    required this.description,
    required this.inputCount,
    required this.outputCount,
    required this.matchTolerancePct,
    required this.gears,
  });

  final String id;
  final String name;
  final String description;
  final int inputCount;
  final int outputCount;
  final double matchTolerancePct;
  final List<GearRow> gears;

  GearMappingPreset copyWith({
    String? id,
    String? name,
    String? description,
    int? inputCount,
    int? outputCount,
    double? matchTolerancePct,
    List<GearRow>? gears,
  }) {
    return GearMappingPreset(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      inputCount: inputCount ?? this.inputCount,
      outputCount: outputCount ?? this.outputCount,
      matchTolerancePct: matchTolerancePct ?? this.matchTolerancePct,
      gears: gears ?? List.from(this.gears),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'inputCount': inputCount,
        'outputCount': outputCount,
        'matchTolerancePct': matchTolerancePct,
        'gears': gears.map((e) => e.toJson()).toList(),
      };

  factory GearMappingPreset.fromJson(Map<String, dynamic> json) {
    final rawGears = json['gears'] as List<dynamic>? ?? const [];
    return GearMappingPreset(
      id: json['id'] as String? ?? 'custom',
      name: json['name'] as String? ?? 'Custom',
      description: json['description'] as String? ?? '',
      inputCount: (json['inputCount'] as num?)?.toInt() ?? 3,
      outputCount: (json['outputCount'] as num?)?.toInt() ?? 2,
      matchTolerancePct: (json['matchTolerancePct'] as num?)?.toDouble() ?? 2.0,
      gears: rawGears
          .map((e) => GearRow.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

class DeviceInfo {
  const DeviceInfo({
    required this.fwVersion,
    required this.hwRev,
    required this.presetId,
    required this.inputCount,
    required this.outputCount,
  });

  final String fwVersion;
  final String hwRev;
  final String presetId;
  final int inputCount;
  final int outputCount;

  factory DeviceInfo.fromJson(Map<String, dynamic> json) {
    return DeviceInfo(
      fwVersion: json['fwVersion'] as String? ?? '?',
      hwRev: json['hwRev'] as String? ?? '?',
      presetId: json['presetId'] as String? ?? '',
      inputCount: (json['inputCount'] as num?)?.toInt() ?? 3,
      outputCount: (json['outputCount'] as num?)?.toInt() ?? 2,
    );
  }
}

class LiveChannelReading {
  const LiveChannelReading({
    required this.dutyPct,
    required this.periodMs,
  });

  final double dutyPct;
  final double periodMs;
}

class LiveDeviceStatus {
  const LiveDeviceStatus({
    required this.gearIndex,
    required this.outputsDisabled,
    required this.configDirty,
    required this.inputs,
    required this.outputs,
  });

  final int gearIndex;
  final bool outputsDisabled;
  final bool configDirty;
  final List<LiveChannelReading> inputs;
  final List<LiveChannelReading> outputs;

  String get gearLabel {
    if (gearIndex >= 0 && gearIndex < kGearLabels.length) {
      return kGearLabels[gearIndex];
    }
    return 'Unknown';
  }

  static const empty = LiveDeviceStatus(
    gearIndex: kGearUnknown,
    outputsDisabled: true,
    configDirty: false,
    inputs: [
      LiveChannelReading(dutyPct: 0, periodMs: 0),
      LiveChannelReading(dutyPct: 0, periodMs: 0),
      LiveChannelReading(dutyPct: 0, periodMs: 0),
    ],
    outputs: [
      LiveChannelReading(dutyPct: 0, periodMs: 0),
      LiveChannelReading(dutyPct: 0, periodMs: 0),
    ],
  );
}
