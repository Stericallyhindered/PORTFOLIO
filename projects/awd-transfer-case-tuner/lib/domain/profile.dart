import 'custom_map_slot.dart';
import 'mode_bundle.dart';
import 'preset_mode_id.dart';

class Profile {
  Profile({
    required this.version,
    required Map<PresetModeId, ModeBundle> presets,
    required List<CustomMapSlot> customSlots,
    required this.maxSteerAngleDeg,
    /// Nominal \(\Delta t\) between telemetry callbacks for ramp math (set from device rate).
    /// PDF clutch engagement narrative ~0.1 s — use \(\ge\) device Hz when known.
    this.telemetryHz = 50,
    this.globalMaxPwm = defaultGlobalMaxPwm,
  })  : presets = Map<PresetModeId, ModeBundle>.from(presets),
        customSlots = List<CustomMapSlot>.from(customSlots) {
    assert(customSlots.length == 3);
  }

  static const double defaultGlobalMaxPwm = 40;

  final int version;
  final Map<PresetModeId, ModeBundle> presets;
  final List<CustomMapSlot> customSlots;
  final double maxSteerAngleDeg;
  final double telemetryHz;
  final double globalMaxPwm;

  ModeBundle bundleForPreset(PresetModeId id) => presets[id]!;

  ModeBundle bundleForCustom(int slotId) {
    return customSlots.firstWhere((s) => s.slotId == slotId).bundle;
  }

  Profile copyWith({
    int? version,
    Map<PresetModeId, ModeBundle>? presets,
    List<CustomMapSlot>? customSlots,
    double? maxSteerAngleDeg,
    double? telemetryHz,
    double? globalMaxPwm,
  }) {
    return Profile(
      version: version ?? this.version,
      presets: presets ?? Map<PresetModeId, ModeBundle>.from(this.presets),
      customSlots: customSlots ?? List<CustomMapSlot>.from(this.customSlots),
      maxSteerAngleDeg: maxSteerAngleDeg ?? this.maxSteerAngleDeg,
      telemetryHz: telemetryHz ?? this.telemetryHz,
      globalMaxPwm: globalMaxPwm ?? this.globalMaxPwm,
    );
  }

  Map<String, dynamic> toJson() => {
        'version': version,
        'maxSteerAngleDeg': maxSteerAngleDeg,
        'telemetryHz': telemetryHz,
        'globalMaxPwm': globalMaxPwm,
        'presets': presets.map(
          (k, v) => MapEntry(k.name, v.toJson()),
        ),
        'customSlots': customSlots.map((e) => e.toJson()).toList(),
      };

  factory Profile.fromJson(Map<String, dynamic> json) {
    final rawP = json['presets'] as Map<String, dynamic>? ?? {};
    final presets = <PresetModeId, ModeBundle>{};
    for (final e in rawP.entries) {
      final id = PresetModeId.values.firstWhere(
        (p) => p.name == e.key,
        orElse: () => PresetModeId.autoAwd,
      );
      presets[id] = ModeBundle.fromJson(Map<String, dynamic>.from(e.value as Map));
    }
    final rawC = json['customSlots'] as List<dynamic>? ?? const [];
    final slots = rawC
        .map((e) => CustomMapSlot.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return Profile(
      version: (json['version'] as num?)?.toInt() ?? 1,
      presets: presets,
      customSlots: slots,
      maxSteerAngleDeg: (json['maxSteerAngleDeg'] as num?)?.toDouble() ?? 540,
      telemetryHz: (json['telemetryHz'] as num?)?.toDouble() ?? 50,
      globalMaxPwm: (json['globalMaxPwm'] as num?)?.toDouble() ?? defaultGlobalMaxPwm,
    );
  }
}
