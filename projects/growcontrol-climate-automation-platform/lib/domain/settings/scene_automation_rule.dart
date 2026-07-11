import 'package:flutter/foundation.dart';

/// Sensor signal used in a scene rule condition.
enum SceneConditionMetric {
  temperatureC,
  rhPercent,
  vpdKpa,
}

enum SceneCompareOp {
  below,
  above,
}

/// ALL = every condition must pass; ANY = at least one passes.
enum SceneConditionCombine {
  all,
  any,
}

@immutable
class SceneCondition {
  const SceneCondition({
    required this.metric,
    required this.op,
    required this.value,
  });

  final SceneConditionMetric metric;
  final SceneCompareOp op;
  final double value;

  Map<String, dynamic> toJson() => {
        'metric': metric.name,
        'op': op.name,
        'value': value,
      };

  factory SceneCondition.fromJson(Map<String, dynamic> j) {
    return SceneCondition(
      metric: SceneConditionMetric.values.byName(j['metric'] as String),
      op: SceneCompareOp.values.byName(j['op'] as String),
      value: (j['value'] as num).toDouble(),
    );
  }

  SceneCondition copyWith({
    SceneConditionMetric? metric,
    SceneCompareOp? op,
    double? value,
  }) {
    return SceneCondition(
      metric: metric ?? this.metric,
      op: op ?? this.op,
      value: value ?? this.value,
    );
  }
}

@immutable
class SceneRuleAction {
  const SceneRuleAction({
    required this.deviceId,
    required this.turnOn,
  });

  final String deviceId;
  final bool turnOn;

  Map<String, dynamic> toJson() => {
        'deviceId': deviceId,
        'turnOn': turnOn,
      };

  factory SceneRuleAction.fromJson(Map<String, dynamic> j) {
    return SceneRuleAction(
      deviceId: j['deviceId'] as String,
      turnOn: j['turnOn'] as bool,
    );
  }

  SceneRuleAction copyWith({
    String? deviceId,
    bool? turnOn,
  }) {
    return SceneRuleAction(
      deviceId: deviceId ?? this.deviceId,
      turnOn: turnOn ?? this.turnOn,
    );
  }
}

@immutable
class SceneAutomationRule {
  const SceneAutomationRule({
    required this.id,
    this.conditions = const [],
    this.combine = SceneConditionCombine.all,
    this.actions = const [],
  });

  final String id;
  final List<SceneCondition> conditions;
  final SceneConditionCombine combine;
  final List<SceneRuleAction> actions;

  Map<String, dynamic> toJson() => {
        'id': id,
        'conditions': conditions.map((c) => c.toJson()).toList(),
        'combine': combine.name,
        'actions': actions.map((a) => a.toJson()).toList(),
      };

  factory SceneAutomationRule.fromJson(Map<String, dynamic> j) {
    final cond = <SceneCondition>[];
    final rawC = j['conditions'];
    if (rawC is List) {
      for (final x in rawC) {
        cond.add(SceneCondition.fromJson(Map<String, dynamic>.from(x as Map)));
      }
    }
    final acts = <SceneRuleAction>[];
    final rawA = j['actions'];
    if (rawA is List) {
      for (final x in rawA) {
        acts.add(SceneRuleAction.fromJson(Map<String, dynamic>.from(x as Map)));
      }
    }
    return SceneAutomationRule(
      id: j['id'] as String,
      conditions: cond,
      combine: SceneConditionCombine.values.byName(
        j['combine'] as String? ?? SceneConditionCombine.all.name,
      ),
      actions: acts,
    );
  }

  SceneAutomationRule copyWith({
    List<SceneCondition>? conditions,
    SceneConditionCombine? combine,
    List<SceneRuleAction>? actions,
  }) {
    return SceneAutomationRule(
      id: id,
      conditions: conditions ?? this.conditions,
      combine: combine ?? this.combine,
      actions: actions ?? this.actions,
    );
  }
}
