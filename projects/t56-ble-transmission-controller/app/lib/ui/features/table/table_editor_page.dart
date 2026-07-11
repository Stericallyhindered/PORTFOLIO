import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../domain/models.dart';
import '../../../providers/app_providers.dart';
import '../../theme/app_theme.dart';

class TableEditorPage extends ConsumerStatefulWidget {
  const TableEditorPage({super.key});

  @override
  ConsumerState<TableEditorPage> createState() => _TableEditorPageState();
}

class _TableEditorPageState extends ConsumerState<TableEditorPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _gearIndex = 0;
  bool _showOutputs = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() => _showOutputs = _tabController.index == 1);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final active = ref.watch(activePresetProvider);
    final connected = ref.watch(isConnectedProvider);
    final client = ref.watch(bleDeviceClientProvider);

    return active.when(
      data: (preset) {
        if (preset == null) {
          return const Center(child: Text('No preset loaded'));
        }
        if (_gearIndex >= preset.gears.length) _gearIndex = 0;
        final row = preset.gears[_gearIndex];

        return Column(
          children: [
            stripeHeader(
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'TABLE EDITOR',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  if (connected)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: GrannasColors.accentAlt),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'DEVICE LINKED',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: GrannasColors.accentAlt,
                              fontSize: 10,
                            ),
                      ),
                    ),
                ],
              ),
            ),
            TabBar(
              controller: _tabController,
              indicatorColor: GrannasColors.accent,
              labelColor: GrannasColors.accent,
              unselectedLabelColor: GrannasColors.textMuted,
              tabs: const [
                Tab(text: 'INPUTS (3)'),
                Tab(text: 'OUTPUTS (2)'),
              ],
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  DropdownButtonFormField<int>(
                    value: _gearIndex,
                    decoration: const InputDecoration(labelText: 'Gear'),
                    items: List.generate(preset.gears.length, (i) {
                      return DropdownMenuItem(
                        value: i,
                        child: Text(preset.gears[i].gear),
                      );
                    }),
                    onChanged: (v) => setState(() => _gearIndex = v ?? 0),
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(
                    _showOutputs ? row.outputs.length : row.inputs.length,
                    (ch) {
                      final values =
                          _showOutputs ? row.outputs[ch] : row.inputs[ch];
                      final label = _showOutputs ? 'OUT ${ch + 1}' : 'IN ${ch + 1}';
                      return _ChannelEditor(
                        label: label,
                        values: values,
                        onChanged: (updated) => _updateChannel(
                          preset,
                          ch,
                          updated,
                          outputs: _showOutputs,
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton(
                        onPressed: () async {
                          await ref
                              .read(activePresetProvider.notifier)
                              .updatePreset(preset);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Saved locally')),
                            );
                          }
                        },
                        child: const Text('SAVE LOCAL'),
                      ),
                      if (connected && client != null)
                        OutlinedButton(
                          onPressed: () async {
                            try {
                              await client.pushPreset(preset);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Pushed to device')),
                                );
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Push failed: $e')),
                                );
                              }
                            }
                          },
                          child: const Text('PUSH TO DEVICE'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Future<void> _updateChannel(
    GearMappingPreset preset,
    int channelIndex,
    PwmChannelValues updated, {
    required bool outputs,
  }) async {
    final rows = List<GearRow>.from(preset.gears);
    final row = rows[_gearIndex];
    if (outputs) {
      final outs = List<PwmChannelValues>.from(row.outputs);
      outs[channelIndex] = updated;
      rows[_gearIndex] = row.copyWith(outputs: outs);
    } else {
      final ins = List<PwmChannelValues>.from(row.inputs);
      ins[channelIndex] = updated;
      rows[_gearIndex] = row.copyWith(inputs: ins);
    }
    final updatedPreset = preset.copyWith(gears: rows);
    await ref.read(activePresetProvider.notifier).updatePreset(updatedPreset);
  }
}

class _ChannelEditor extends StatefulWidget {
  const _ChannelEditor({
    required this.label,
    required this.values,
    required this.onChanged,
  });

  final String label;
  final PwmChannelValues values;
  final ValueChanged<PwmChannelValues> onChanged;

  @override
  State<_ChannelEditor> createState() => _ChannelEditorState();
}

class _ChannelEditorState extends State<_ChannelEditor> {
  late TextEditingController _duty;
  late TextEditingController _period;
  late TextEditingController _vavg;
  late TextEditingController _vrms;
  late TextEditingController _vmax;
  late TextEditingController _vmin;

  @override
  void initState() {
    super.initState();
    _syncControllers();
  }

  @override
  void didUpdateWidget(covariant _ChannelEditor oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.values != widget.values) _syncControllers();
  }

  void _syncControllers() {
    _duty = TextEditingController(text: widget.values.dutyPct.toString());
    _period = TextEditingController(text: widget.values.periodMs.toString());
    _vavg = TextEditingController(text: widget.values.vavg.toString());
    _vrms = TextEditingController(text: widget.values.vrms.toString());
    _vmax = TextEditingController(text: widget.values.vmax.toString());
    _vmin = TextEditingController(text: widget.values.vmin.toString());
  }

  @override
  void dispose() {
    _duty.dispose();
    _period.dispose();
    _vavg.dispose();
    _vrms.dispose();
    _vmax.dispose();
    _vmin.dispose();
    super.dispose();
  }

  void _emit() {
    widget.onChanged(PwmChannelValues(
      dutyPct: double.tryParse(_duty.text) ?? 0,
      periodMs: double.tryParse(_period.text) ?? 4,
      vavg: double.tryParse(_vavg.text) ?? 0,
      vrms: double.tryParse(_vrms.text) ?? 0,
      vmax: double.tryParse(_vmax.text) ?? 0,
      vmin: double.tryParse(_vmin.text) ?? 0,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: grannasCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.label, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            _field('Duty %', _duty),
            _field('Period ms', _period),
            _field('Vavg', _vavg),
            _field('Vrms', _vrms),
            _field('Vmax', _vmax),
            _field('Vmin', _vmin),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: _emit, child: const Text('APPLY ROW')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController c) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextField(
        controller: c,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(labelText: label),
        onSubmitted: (_) => _emit(),
      ),
    );
  }
}

class ImportExportPage extends ConsumerWidget {
  const ImportExportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(activePresetProvider);
    final store = ref.read(localPresetStoreProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        stripeHeader(
          child: Text('IMPORT / EXPORT', style: Theme.of(context).textTheme.titleLarge),
        ),
        const SizedBox(height: 16),
        grannasCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Export active preset as JSON', style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: active.maybeWhen(
                  data: (preset) => preset == null
                      ? null
                      : () async {
                          final path = await store.exportPreset(preset);
                          await Share.shareXFiles([XFile(path)],
                              subject: '${preset.name} preset');
                        },
                  orElse: () => null,
                ),
                child: const Text('EXPORT JSON'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        grannasCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Import preset from JSON file', style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () async {
                  final result = await FilePicker.platform.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: ['json'],
                  );
                  if (result == null || result.files.single.path == null) return;
                  final raw = await File(result.files.single.path!).readAsString();
                  try {
                    final preset = store.importFromJsonString(raw);
                    await ref.read(activePresetProvider.notifier).setPreset(preset);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Imported ${preset.name}')),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Import failed: $e')),
                      );
                    }
                  }
                },
                child: const Text('IMPORT JSON'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
