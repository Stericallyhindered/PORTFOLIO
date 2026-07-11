import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';

import '../../domain/settings/grow_scene.dart';
import '../../domain/settings/scene_automation_rule.dart';
import '../../domain/vpd/vpd_tables.dart';
import '../../services/settings_repository.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import 'scene_rules_editor.dart';

Future<void> showSceneEditorSheet(
  BuildContext context, {
  GrowScene? scene,
}) async {
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: false,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppTheme.surfaceElevated,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
    ),
    builder: (ctx) => _SceneEditorBody(existing: scene),
  );
}

class _SceneEditorBody extends StatefulWidget {
  const _SceneEditorBody({this.existing});

  final GrowScene? existing;

  @override
  State<_SceneEditorBody> createState() => _SceneEditorBodyState();
}

class _SceneEditorBodyState extends State<_SceneEditorBody> {
  late final TextEditingController _name;
  late Set<String> _members;
  GrowthStage? _stageOverride;
  PhotoperiodPhase? _photoOverride;
  late List<SceneAutomationRule> _rules;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: e?.name ?? '');
    _members = {...?e?.memberDeviceIds};
    _stageOverride = e?.stageOverride;
    _photoOverride = e?.photoperiodOverride;
    _rules = List<SceneAutomationRule>.from(e?.automationRules ?? const []);
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save(BuildContext ctx) async {
    final settings = ctx.read<SettingsRepository>();
    final name = _name.text.trim();
    if (name.isEmpty) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(
            content: Text(
              'Add a name for this automation.',
              style: AppTheme.fontMono(12),
            ),
          ),
        );
      }
      return;
    }

    final id = widget.existing?.id ?? const Uuid().v4();
    final scene = GrowScene(
      id: id,
      name: name,
      memberDeviceIds: _members.toList(),
      stageOverride: _stageOverride,
      photoperiodOverride: _photoOverride,
      automationOverrides: widget.existing?.automationOverrides ?? const {},
      automationRules: _rules,
    );
    final room = ctx.read<GrowRoomController>();
    await settings.upsertScene(scene);
    try {
      await room.pushSceneToSupabase(scene);
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(
            content: Text(
              'Saved on phone; cloud sync failed: $e',
              style: AppTheme.fontMono(11),
            ),
          ),
        );
      }
    }
    if (ctx.mounted) Navigator.pop(ctx);
  }

  @override
  Widget build(BuildContext context) {
    final devices = context.watch<GrowRoomController>().devices;
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.existing == null ? 'NEW SCENE' : 'EDIT SCENE',
                style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Automation name'),
              ),
              const SizedBox(height: 16),
              Text(
                'DEVICES IN SCENE',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText),
              ),
              const SizedBox(height: 8),
              if (devices.isEmpty)
                Text(
                  'No devices loaded yet — pair on Devices tab first.',
                  style: AppTheme.fontMono(11, color: AppTheme.alertOrange),
                )
              else
                ...devices.map((d) {
                  final on = _members.contains(d.id);
                  return CheckboxListTile(
                    value: on,
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _members.add(d.id);
                        } else {
                          _members.remove(d.id);
                        }
                      });
                    },
                    title: Text(d.name),
                    subtitle: Text(
                      '${d.role.name} · ${d.kind.name}',
                      style: AppTheme.fontMono(10),
                    ),
                    dense: true,
                  );
                }),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Growth stage override'),
                value: _stageOverride?.name ?? '__none__',
                items: [
                  const DropdownMenuItem(
                    value: '__none__',
                    child: Text('None (use dashboard)'),
                  ),
                  ...GrowthStage.values.map(
                    (s) => DropdownMenuItem(
                      value: s.name,
                      child: Text(VpdReferenceTable.stageLabel(s)),
                    ),
                  ),
                ],
                onChanged: (v) {
                  setState(() {
                    _stageOverride =
                        v == null || v == '__none__' ? null : GrowthStage.values.byName(v);
                  });
                },
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                decoration:
                    const InputDecoration(labelText: 'Photoperiod override'),
                value: _photoOverride?.name ?? '__none__',
                items: [
                  const DropdownMenuItem(
                    value: '__none__',
                    child: Text('None (use dashboard)'),
                  ),
                  ...PhotoperiodPhase.values.map(
                    (p) => DropdownMenuItem(
                      value: p.name,
                      child: Text(p.name),
                    ),
                  ),
                ],
                onChanged: (v) {
                  setState(() {
                    _photoOverride = v == null || v == '__none__'
                        ? null
                        : PhotoperiodPhase.values.byName(v);
                  });
                },
              ),
              const SizedBox(height: 20),
              SceneRulesEditor(
                rules: _rules,
                onRulesChanged: (r) => setState(() => _rules = r),
                devices: devices,
              ),
              const SizedBox(height: 22),
              FilledButton(
                onPressed: () => _save(context),
                child: Text(widget.existing == null ? 'CREATE SCENE' : 'SAVE'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
