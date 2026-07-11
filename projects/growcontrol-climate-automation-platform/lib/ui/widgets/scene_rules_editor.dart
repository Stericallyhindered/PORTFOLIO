import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';

import '../../domain/models/grow_device.dart';
import '../../domain/settings/scene_automation_rule.dart';
import '../../theme/app_theme.dart';

/// Threshold rules: temp / RH / VPD → outlet ON/OFF. ALL vs ANY per rule.
class SceneRulesEditor extends StatelessWidget {
  const SceneRulesEditor({
    super.key,
    required this.rules,
    required this.onRulesChanged,
    required this.devices,
  });

  final List<SceneAutomationRule> rules;
  final ValueChanged<List<SceneAutomationRule>> onRulesChanged;
  final List<GrowDevice> devices;

  List<GrowDevice> get _outlets => devices
      .where((d) => d.kind == GrowHardwareKind.smartOutlet)
      .toList();

  void _updateAt(int i, SceneAutomationRule r) {
    final next = List<SceneAutomationRule>.from(rules);
    next[i] = r;
    onRulesChanged(next);
  }

  void _addRule() {
    onRulesChanged([
      ...rules,
      SceneAutomationRule(
        id: const Uuid().v4(),
        conditions: const [
          SceneCondition(
            metric: SceneConditionMetric.rhPercent,
            op: SceneCompareOp.above,
            value: 65,
          ),
        ],
        combine: SceneConditionCombine.all,
        actions: _outlets.isNotEmpty
            ? [
                SceneRuleAction(
                  deviceId: _outlets.first.id,
                  turnOn: true,
                ),
              ]
            : const [],
      ),
    ]);
  }

  void _removeRule(int i) {
    final next = List<SceneAutomationRule>.from(rules)..removeAt(i);
    onRulesChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'AUTOMATION RULES',
          style: AppTheme.fontMono(10, color: AppTheme.mutedText),
        ),
        const SizedBox(height: 6),
        Text(
          'When a rule’s conditions match, its outlet actions run (later rules override earlier ones per device). '
          'Use ALL when every check must pass; ANY when one is enough. '
          'Example: RH above 70 → fan ON; separate rule RH below 65 → fan OFF.',
          style: AppTheme.fontMono(10, color: AppTheme.mutedText.withOpacity(0.9)),
        ),
        const SizedBox(height: 12),
        if (_outlets.isEmpty)
          Text(
            'No smart outlets loaded — pair outlets first.',
            style: AppTheme.fontMono(11, color: AppTheme.alertOrange),
          )
        else ...[
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: rules.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) {
              final r = rules[i];
              return _RuleCard(
                index: i + 1,
                rule: r,
                outlets: _outlets,
                onChanged: (nr) => _updateAt(i, nr),
                onDelete: () => _removeRule(i),
              );
            },
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _addRule,
            icon: const Icon(Icons.add, size: 18),
            label: const Text('ADD RULE'),
          ),
        ],
      ],
    );
  }
}

class _RuleCard extends StatelessWidget {
  const _RuleCard({
    required this.index,
    required this.rule,
    required this.outlets,
    required this.onChanged,
    required this.onDelete,
  });

  final int index;
  final SceneAutomationRule rule;
  final List<GrowDevice> outlets;
  final ValueChanged<SceneAutomationRule> onChanged;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.neonPink.withOpacity(0.18)),
        color: AppTheme.surface.withOpacity(0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                'RULE $index',
                style: AppTheme.fontMono(11, color: AppTheme.neonCyan),
              ),
              const Spacer(),
              IconButton(
                tooltip: 'Remove rule',
                icon: Icon(Icons.delete_outline,
                    color: AppTheme.alertOrange.withOpacity(0.85)),
                onPressed: onDelete,
              ),
            ],
          ),
          DropdownButtonFormField<SceneConditionCombine>(
            decoration: const InputDecoration(labelText: 'Conditions'),
            value: rule.combine,
            items: const [
              DropdownMenuItem(
                value: SceneConditionCombine.all,
                child: Text('ALL must match'),
              ),
              DropdownMenuItem(
                value: SceneConditionCombine.any,
                child: Text('ANY may match'),
              ),
            ],
            onChanged: (v) {
              if (v != null) onChanged(rule.copyWith(combine: v));
            },
          ),
          const SizedBox(height: 8),
          Text('When…', style: AppTheme.fontMono(10, color: AppTheme.mutedText)),
          const SizedBox(height: 6),
          for (var ci = 0; ci < rule.conditions.length; ci++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _ConditionRow(
                c: rule.conditions[ci],
                onChanged: (nc) {
                  final list = List<SceneCondition>.from(rule.conditions);
                  list[ci] = nc;
                  onChanged(rule.copyWith(conditions: list));
                },
                onRemove: rule.conditions.length <= 1
                    ? null
                    : () {
                        final list = List<SceneCondition>.from(rule.conditions)
                          ..removeAt(ci);
                        onChanged(rule.copyWith(conditions: list));
                      },
              ),
            ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () {
                final list = List<SceneCondition>.from(rule.conditions)
                  ..add(
                    const SceneCondition(
                      metric: SceneConditionMetric.rhPercent,
                      op: SceneCompareOp.below,
                      value: 55,
                    ),
                  );
                onChanged(rule.copyWith(conditions: list));
              },
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add condition'),
            ),
          ),
          const SizedBox(height: 6),
          Text('Then…', style: AppTheme.fontMono(10, color: AppTheme.mutedText)),
          const SizedBox(height: 6),
          for (var ai = 0; ai < rule.actions.length; ai++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _ActionRow(
                outlets: outlets,
                a: rule.actions[ai],
                onChanged: (na) {
                  final list = List<SceneRuleAction>.from(rule.actions);
                  list[ai] = na;
                  onChanged(rule.copyWith(actions: list));
                },
                onRemove: () {
                  final list = List<SceneRuleAction>.from(rule.actions)
                    ..removeAt(ai);
                  onChanged(rule.copyWith(actions: list));
                },
              ),
            ),
          TextButton.icon(
            onPressed: outlets.isEmpty
                ? null
                : () {
                    final list = List<SceneRuleAction>.from(rule.actions)
                      ..add(
                        SceneRuleAction(
                          deviceId: outlets.first.id,
                          turnOn: true,
                        ),
                      );
                    onChanged(rule.copyWith(actions: list));
                  },
            icon: const Icon(Icons.power_settings_new, size: 16),
            label: const Text('Add outlet action'),
          ),
        ],
      ),
    );
  }
}

class _ConditionRow extends StatefulWidget {
  const _ConditionRow({
    required this.c,
    required this.onChanged,
    this.onRemove,
  });

  final SceneCondition c;
  final ValueChanged<SceneCondition> onChanged;
  final VoidCallback? onRemove;

  @override
  State<_ConditionRow> createState() => _ConditionRowState();
}

class _ConditionRowState extends State<_ConditionRow> {
  late final TextEditingController _valueCtl;

  @override
  void initState() {
    super.initState();
    _valueCtl = TextEditingController(
      text: widget.c.value.toString(),
    );
  }

  @override
  void didUpdateWidget(covariant _ConditionRow old) {
    super.didUpdateWidget(old);
    if (old.c.value != widget.c.value &&
        double.tryParse(_valueCtl.text) != widget.c.value) {
      _valueCtl.text = widget.c.value.toString();
    }
  }

  @override
  void dispose() {
    _valueCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.c;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 3,
          child: DropdownButtonFormField<SceneConditionMetric>(
            decoration: const InputDecoration(isDense: true),
            value: c.metric,
            items: const [
              DropdownMenuItem(
                value: SceneConditionMetric.temperatureC,
                child: Text('Temp °C'),
              ),
              DropdownMenuItem(
                value: SceneConditionMetric.rhPercent,
                child: Text('RH %'),
              ),
              DropdownMenuItem(
                value: SceneConditionMetric.vpdKpa,
                child: Text('VPD kPa'),
              ),
            ],
            onChanged: (v) {
              if (v != null) widget.onChanged(c.copyWith(metric: v));
            },
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          flex: 2,
          child: DropdownButtonFormField<SceneCompareOp>(
            decoration: const InputDecoration(isDense: true),
            value: c.op,
            items: const [
              DropdownMenuItem(
                value: SceneCompareOp.below,
                child: Text('<'),
              ),
              DropdownMenuItem(
                value: SceneCompareOp.above,
                child: Text('>'),
              ),
            ],
            onChanged: (v) {
              if (v != null) widget.onChanged(c.copyWith(op: v));
            },
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          flex: 2,
          child: TextField(
            controller: _valueCtl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              isDense: true,
              labelText: 'Value',
            ),
            onChanged: (s) {
              final v = double.tryParse(s);
              if (v != null) widget.onChanged(c.copyWith(value: v));
            },
          ),
        ),
        if (widget.onRemove != null)
          IconButton(
            icon: const Icon(Icons.close, size: 18),
            onPressed: widget.onRemove,
          ),
      ],
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({
    required this.outlets,
    required this.a,
    required this.onChanged,
    required this.onRemove,
  });

  final List<GrowDevice> outlets;
  final SceneRuleAction a;
  final ValueChanged<SceneRuleAction> onChanged;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              isDense: true,
              labelText: 'Outlet',
            ),
            value: outlets.any((o) => o.id == a.deviceId)
                ? a.deviceId
                : outlets.first.id,
            items: outlets
                .map(
                  (o) => DropdownMenuItem(
                    value: o.id,
                    child: Text(
                      o.name,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: (id) {
              if (id != null) onChanged(a.copyWith(deviceId: id));
            },
          ),
        ),
        const SizedBox(width: 8),
        SegmentedButton<bool>(
          segments: const [
            ButtonSegment(value: true, label: Text('ON')),
            ButtonSegment(value: false, label: Text('OFF')),
          ],
          selected: {a.turnOn},
          onSelectionChanged: (s) => onChanged(a.copyWith(turnOn: s.first)),
        ),
        IconButton(
          icon: const Icon(Icons.close, size: 18),
          onPressed: onRemove,
        ),
      ],
    );
  }
}
