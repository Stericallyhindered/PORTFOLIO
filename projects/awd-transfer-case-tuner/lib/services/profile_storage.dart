import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../domain/profile.dart';

class ProfileStorage {
  static const _fileName = 'awd_active_profile.json';

  Future<File> _file() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/$_fileName');
  }

  Future<Profile?> load() async {
    final f = await _file();
    if (!await f.exists()) return null;
    final txt = await f.readAsString();
    final map = jsonDecode(txt) as Map<String, dynamic>;
    return Profile.fromJson(map);
  }

  Future<void> save(Profile profile) async {
    final f = await _file();
    await f.writeAsString(const JsonEncoder.withIndent('  ').convert(profile.toJson()));
  }

  Future<File> exportNamedFile(String safeName, Profile profile) async {
    final dir = await getApplicationDocumentsDirectory();
    final name = safeName.replaceAll(RegExp(r'[^\w\-\s]'), '_').trim();
    final file = File('${dir.path}/awd_tune_$name.json');
    await file.writeAsString(const JsonEncoder.withIndent('  ').convert(profile.toJson()));
    return file;
  }

  Future<Profile?> importFromPath(String path) async {
    final f = File(path);
    final txt = await f.readAsString();
    return Profile.fromJson(jsonDecode(txt) as Map<String, dynamic>);
  }
}
