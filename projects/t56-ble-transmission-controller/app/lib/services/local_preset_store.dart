import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

import '../domain/models.dart';

class LocalPresetStore {
  static const bundled = [
    'assets/presets/t56_stock.json',
    'assets/presets/blank_bmw_outputs.json',
    'assets/presets/bmw_e46_t56.json',
  ];

  Future<List<GearMappingPreset>> loadBundledPresets() async {
    final presets = <GearMappingPreset>[];
    for (final path in bundled) {
      final raw = await rootBundle.loadString(path);
      presets.add(GearMappingPreset.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      ));
    }
    return presets;
  }

  Future<File> _activeFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/active_preset.json');
  }

  Future<GearMappingPreset?> loadActivePreset() async {
    final file = await _activeFile();
    if (!await file.exists()) return null;
    final raw = await file.readAsString();
    return GearMappingPreset.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> saveActivePreset(GearMappingPreset preset) async {
    final file = await _activeFile();
    await file.writeAsString(jsonEncode(preset.toJson()));
  }

  Future<String> exportPreset(GearMappingPreset preset) async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/${preset.id}_export.json');
    await file.writeAsString(const JsonEncoder.withIndent('  ').convert(preset.toJson()));
    return file.path;
  }

  GearMappingPreset importFromJsonString(String raw) {
    return GearMappingPreset.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }
}
