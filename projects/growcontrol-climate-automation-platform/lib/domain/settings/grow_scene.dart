import 'package:flutter/foundation.dart';

import '../vpd/vpd_tables.dart';
import 'actuator_role_settings.dart';
import 'scene_automation_rule.dart';

@immutable
class GrowScene {
  const GrowScene({
    required this.id,
    required this.name,
    this.memberDeviceIds = const [],
    this.stageOverride,
    this.photoperiodOverride,
    /// Per-device automation overrides when this scene is active (partial merge).
    this.automationOverrides = const {},
    /// When active, optional threshold rules override outlet commands from matching rows.
    this.automationRules = const [],
  });

  final String id;
  final String name;
  final List<String> memberDeviceIds;
  final GrowthStage? stageOverride;
  final PhotoperiodPhase? photoperiodOverride;
  final Map<String, ActuatorRoleSettings> automationOverrides;
  final List<SceneAutomationRule> automationRules;

  GrowScene copyWith({
    String? name,
    List<String>? memberDeviceIds,
    GrowthStage? stageOverride,
    PhotoperiodPhase? photoperiodOverride,
    Map<String, ActuatorRoleSettings>? automationOverrides,
    List<SceneAutomationRule>? automationRules,
    bool clearStageOverride = false,
    bool clearPhotoperiodOverride = false,
  }) {
    return GrowScene(
      id: id,
      name: name ?? this.name,
      memberDeviceIds: memberDeviceIds ?? this.memberDeviceIds,
      stageOverride: clearStageOverride ? null : (stageOverride ?? this.stageOverride),
      photoperiodOverride: clearPhotoperiodOverride
          ? null
          : (photoperiodOverride ?? this.photoperiodOverride),
      automationOverrides: automationOverrides ?? this.automationOverrides,
      automationRules: automationRules ?? this.automationRules,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'memberDeviceIds': memberDeviceIds,
        if (stageOverride != null) 'stageOverride': stageOverride!.name,
        if (photoperiodOverride != null)
          'photoperiodOverride': photoperiodOverride!.name,
        'automationOverrides': automationOverrides.map(
          (k, v) => MapEntry(k, v.toJson()),
        ),
        'automationRules': automationRules.map((r) => r.toJson()).toList(),
      };

  factory GrowScene.fromJson(Map<String, dynamic> j) {
    final overrides = <String, ActuatorRoleSettings>{};
    final raw = j['automationOverrides'];
    if (raw is Map) {
      for (final e in raw.entries) {
        overrides[e.key as String] = ActuatorRoleSettings.fromJson(
          Map<String, dynamic>.from(e.value as Map),
        );
      }
    }
    final rules = <SceneAutomationRule>[];
    final rawRules = j['automationRules'];
    if (rawRules is List) {
      for (final x in rawRules) {
        rules.add(
          SceneAutomationRule.fromJson(Map<String, dynamic>.from(x as Map)),
        );
      }
    }
    return GrowScene(
      id: j['id'] as String,
      name: j['name'] as String,
      memberDeviceIds: List<String>.from(j['memberDeviceIds'] as List? ?? []),
      stageOverride: j['stageOverride'] != null
          ? GrowthStage.values.byName(j['stageOverride'] as String)
          : null,
      photoperiodOverride: j['photoperiodOverride'] != null
          ? PhotoperiodPhase.values.byName(j['photoperiodOverride'] as String)
          : null,
      automationOverrides: overrides,
      automationRules: rules,
    );
  }
}
