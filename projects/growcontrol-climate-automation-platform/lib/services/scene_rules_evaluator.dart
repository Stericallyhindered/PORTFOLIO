import '../domain/settings/grow_scene.dart';
import '../domain/settings/scene_automation_rule.dart';

/// Evaluates [GrowScene.automationRules] against live environment readings.
class SceneRulesEvaluator {
  SceneRulesEvaluator._();

  static bool _deviceAllowed(GrowScene scene, String deviceId) {
    if (scene.memberDeviceIds.isEmpty) return true;
    return scene.memberDeviceIds.contains(deviceId);
  }

  static bool _conditionPasses(
    SceneCondition c,
    double tempC,
    double rhPercent,
    double vpdKpa,
  ) {
    late double reading;
    switch (c.metric) {
      case SceneConditionMetric.temperatureC:
        reading = tempC;
        break;
      case SceneConditionMetric.rhPercent:
        reading = rhPercent;
        break;
      case SceneConditionMetric.vpdKpa:
        reading = vpdKpa;
        break;
    }
    switch (c.op) {
      case SceneCompareOp.below:
        return reading < c.value;
      case SceneCompareOp.above:
        return reading > c.value;
    }
  }

  static bool ruleMatches(
    SceneAutomationRule rule,
    double tempC,
    double rhPercent,
    double vpdKpa,
  ) {
    if (rule.conditions.isEmpty) return false;
    bool onePasses(SceneCondition c) =>
        _conditionPasses(c, tempC, rhPercent, vpdKpa);
    switch (rule.combine) {
      case SceneConditionCombine.all:
        return rule.conditions.every(onePasses);
      case SceneConditionCombine.any:
        return rule.conditions.any(onePasses);
    }
  }

  /// Last matching rule wins per device id (rules evaluated in list order).
  static Map<String, bool> outletCommandsForScene({
    required GrowScene? scene,
    required double tempC,
    required double rhPercent,
    required double vpdKpa,
  }) {
    if (scene == null || scene.automationRules.isEmpty) {
      return {};
    }
    return outletCommandsForScenes(
      scenes: [scene],
      tempC: tempC,
      rhPercent: rhPercent,
      vpdKpa: vpdKpa,
    );
  }

  /// Multi-scene merge: every active scene's rules are evaluated and the
  /// commands from later scenes (i.e. *more recently activated*) override
  /// earlier ones, mirroring the "newest wears the crown" stack policy in
  /// [SettingsRepository.activeScenes].
  ///
  /// Each per-device decision is the last action emitted by any matching rule
  /// across the whole stack. Rules whose target device isn't in their owning
  /// scene's `memberDeviceIds` are filtered out so a scene only commands its
  /// own members.
  static Map<String, bool> outletCommandsForScenes({
    required List<GrowScene> scenes,
    required double tempC,
    required double rhPercent,
    required double vpdKpa,
  }) {
    final out = <String, bool>{};
    for (final scene in scenes) {
      if (scene.automationRules.isEmpty) continue;
      for (final rule in scene.automationRules) {
        if (!ruleMatches(rule, tempC, rhPercent, vpdKpa)) continue;
        for (final a in rule.actions) {
          if (!_deviceAllowed(scene, a.deviceId)) continue;
          out[a.deviceId] = a.turnOn;
        }
      }
    }
    return out;
  }
}
