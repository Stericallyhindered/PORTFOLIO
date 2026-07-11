import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../domain/settings/grow_scene.dart';
import '../../domain/vpd/vpd_tables.dart';
import '../../services/settings_repository.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/scene_editor_sheet.dart';

/// Lists saved automations, activate / edit / delete — persisted via [SettingsRepository].
///
/// Filename + class still say "scene" because the data model and persistence key
/// (`growcontrol_settings_v1.scenes`) are unchanged; only the user-facing strings
/// were rebranded to "automation" to match the way folks actually think about it.
class ScenesPage extends StatelessWidget {
  const ScenesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsRepository>(
      builder: (context, settings, _) {
        final scenes = settings.scenes;
        final activeIds = settings.activeSceneIds.toSet();

        final room = context.read<GrowRoomController>();
        return Stack(
          fit: StackFit.expand,
          children: [
            if (!settings.isLoaded)
              const Center(child: CircularProgressIndicator())
            else if (scenes.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'No automations yet.\nUse the green NEW AUTOMATION '
                        'action (docked with the nav bar) to add one — pick '
                        'devices, set conditions, and choose overrides.',
                        textAlign: TextAlign.center,
                        style: AppTheme.fontMono(12, color: AppTheme.mutedText),
                      ),
                    ],
                  ),
                ),
              )
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (activeIds.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                      child: Row(
                        children: [
                          Icon(Icons.layers_rounded,
                              size: 14, color: AppTheme.neonCyan),
                          const SizedBox(width: 6),
                          Text(
                            '${activeIds.length} ACTIVE — STACKED',
                            style: AppTheme.fontMono(10,
                                color: AppTheme.neonCyan),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: () async {
                              final ids =
                                  List<String>.from(settings.activeSceneIds);
                              await settings.clearActiveScenes();
                              await room.clearActiveScenesOnSupabase(ids);
                            },
                            child: Text(
                              'CLEAR',
                              style: AppTheme.fontMono(10,
                                  color: AppTheme.alertOrange),
                            ),
                          ),
                        ],
                      ),
                    ),
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: scenes.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final s = scenes[i];
                  final active = activeIds.contains(s.id);
                  // Stack position (1 = oldest active, 2 = next, …) so the
                  // user can tell at a glance which scene wears the crown.
                  final stackIndex = active
                      ? settings.activeSceneIds.indexOf(s.id) + 1
                      : 0;
                  return Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      color: AppTheme.surfaceElevated.withOpacity(0.92),
                      border: Border.all(
                        color: active
                            ? AppTheme.neonCyan.withOpacity(0.55)
                            : AppTheme.neonPink.withOpacity(0.12),
                        width: active ? 1.5 : 1,
                      ),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      leading: IconButton(
                        tooltip: active
                            ? 'Active (#$stackIndex in stack) — tap to disable'
                            : 'Tap to add to active stack',
                        icon: Icon(
                          active ? Icons.check_circle : Icons.circle_outlined,
                          color: active
                              ? AppTheme.neonCyan
                              : AppTheme.mutedText,
                        ),
                        onPressed: () async {
                          final on = !active;
                          await settings.setSceneActive(s.id, on);
                          await room.setSceneActiveOnSupabase(s.id, on);
                        },
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(s.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis)),
                          if (active)
                            Container(
                              margin: const EdgeInsets.only(left: 6),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(6),
                                color: AppTheme.neonCyan.withOpacity(0.2),
                                border: Border.all(
                                    color:
                                        AppTheme.neonCyan.withOpacity(0.6)),
                              ),
                              child: Text(
                                stackIndex ==
                                        settings.activeSceneIds.length
                                    ? 'CROWN'
                                    : '#$stackIndex',
                                style: AppTheme.fontMono(9,
                                    color: AppTheme.neonCyan),
                              ),
                            ),
                        ],
                      ),
                      subtitle: Text(
                        _sceneSubtitle(s),
                        style: AppTheme.fontMono(10, color: AppTheme.mutedText),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit_outlined),
                            tooltip: 'Edit',
                            onPressed: () =>
                                showSceneEditorSheet(context, scene: s),
                          ),
                          IconButton(
                            icon: Icon(Icons.delete_outline,
                                color: AppTheme.alertOrange.withOpacity(0.85)),
                            tooltip: 'Delete',
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('Delete automation?'),
                                  content: Text('“${s.name}” will be removed.'),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(ctx, false),
                                      child: const Text('CANCEL'),
                                    ),
                                    FilledButton(
                                      onPressed: () =>
                                          Navigator.pop(ctx, true),
                                      child: const Text('DELETE'),
                                    ),
                                  ],
                                ),
                              );
                              if (ok == true && context.mounted) {
                                await settings.removeScene(s.id);
                                await room.deleteSceneOnSupabase(s.id);
                              }
                            },
                          ),
                        ],
                      ),
                      onTap: () => showSceneEditorSheet(context, scene: s),
                    ),
                  );
                },
              ),
                  ),
                ],
              ),
          ],
        );
      },
    );
  }

  static String _sceneSubtitle(GrowScene s) {
    final parts = <String>[];
    parts.add('${s.memberDeviceIds.length} device(s)');
    if (s.stageOverride != null) {
      parts.add('stage: ${VpdReferenceTable.stageLabel(s.stageOverride!)}');
    }
    if (s.photoperiodOverride != null) {
      parts.add('photo: ${s.photoperiodOverride!.name}');
    }
    if (s.automationRules.isNotEmpty) {
      parts.add('${s.automationRules.length} rule(s)');
    }
    return parts.join(' · ');
  }
}
