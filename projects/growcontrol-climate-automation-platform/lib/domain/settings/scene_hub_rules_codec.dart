import 'package:uuid/uuid.dart';

import 'scene_automation_rule.dart';

/// The ESP32 hub reads `scenes.automation_rules` as flat rows (see
/// `firmware/growmie-hub/src/supabase_client.cpp`). The Flutter editor uses a
/// richer nested model; we translate at the Supabase boundary.

String hubMetricName(SceneConditionMetric m) {
  switch (m) {
    case SceneConditionMetric.temperatureC:
      return 'temp';
    case SceneConditionMetric.rhPercent:
      return 'rh';
    case SceneConditionMetric.vpdKpa:
      return 'vpd';
  }
}

String hubComparatorName(SceneCompareOp op) {
  switch (op) {
    case SceneCompareOp.above:
      return 'gt';
    case SceneCompareOp.below:
      return 'lt';
  }
}

/// One hub row per (single-condition rule × action). Multi-condition rules are
/// skipped here until the hub evaluator understands them.
List<Map<String, dynamic>> sceneAutomationRulesForSupabaseHub(
  List<SceneAutomationRule> rules,
) {
  final out = <Map<String, dynamic>>[];
  for (final r in rules) {
    if (r.conditions.length != 1) continue;
    final c = r.conditions.first;
    final metric = hubMetricName(c.metric);
    final comparator = hubComparatorName(c.op);
    for (final a in r.actions) {
      out.add({
        'metric': metric,
        'comparator': comparator,
        'value1': c.value,
        'device_id': a.deviceId,
        'desired_on': a.turnOn,
      });
    }
  }
  return out;
}

SceneConditionMetric? sceneMetricFromHub(String hub) {
  switch (hub) {
    case 'temp':
      return SceneConditionMetric.temperatureC;
    case 'rh':
      return SceneConditionMetric.rhPercent;
    case 'vpd':
      return SceneConditionMetric.vpdKpa;
    default:
      return null;
  }
}

SceneCompareOp? sceneCompareFromHub(String hub) {
  switch (hub) {
    case 'gt':
      return SceneCompareOp.above;
    case 'lt':
      return SceneCompareOp.below;
    default:
      return null;
  }
}

/// Rebuilds nested [SceneAutomationRule]s from hub flat JSON (and passes through
/// legacy nested maps unchanged).
List<Map<String, dynamic>> normalizeAutomationRulesJsonForApp(List? raw) {
  if (raw == null || raw.isEmpty) return const [];
  final first = raw.first;
  if (first is Map && first.containsKey('conditions')) {
    return raw
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList(growable: false);
  }
  const uuid = Uuid();
  final out = <Map<String, dynamic>>[];
  for (final x in raw) {
    if (x is! Map) continue;
    final m = Map<String, dynamic>.from(x);
    final metricHub =
        (m['metric'] as String?) ?? (m['Metric'] as String?) ?? '';
    final metric = sceneMetricFromHub(metricHub);
    if (metric == null) continue;
    final compHub = (m['comparator'] as String?) ??
        (m['Comparator'] as String?) ??
        '';
    final op = sceneCompareFromHub(compHub);
    if (op == null) continue;
    final deviceId =
        (m['device_id'] as String?) ?? (m['deviceId'] as String?) ?? '';
    if (deviceId.isEmpty) continue;
    final v1 = (m['value1'] as num?)?.toDouble();
    if (v1 == null) continue;
    final desiredOn =
        (m['desired_on'] as bool?) == true || (m['desiredOn'] as bool?) == true;
    out.add(
      SceneAutomationRule(
        id: uuid.v4(),
        conditions: [
          SceneCondition(metric: metric, op: op, value: v1),
        ],
        actions: [
          SceneRuleAction(deviceId: deviceId, turnOn: desiredOn),
        ],
      ).toJson(),
    );
  }
  return out;
}
