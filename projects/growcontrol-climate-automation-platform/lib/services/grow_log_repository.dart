import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../domain/models/dehu_learning_record.dart';
import '../domain/models/humidifier_ramp_record.dart';
import '../domain/models/outlet_event.dart';
import '../domain/models/sensor_sample.dart';

/// Side-channel for log writes. Implemented by anything that wants every new
/// sample / event mirrored somewhere else (Supabase, future cloud sinks).
/// Observers run synchronously *after* the in-memory list is updated; throwing
/// from an observer must not break the repo, so all callbacks are wrapped.
abstract class GrowLogObserver {
  void onSampleAdded(SensorSample s) {}
  void onOutletEventAdded(OutletEvent e) {}
  void onDehuSegmentAdded(DehumidifierPullDownRecord r) {}
  void onHumSegmentAdded(HumidifierRampRecord r) {}
}

/// Sensor history + events with disk persistence (JSON payload).
class GrowLogRepository {
  GrowLogRepository({Uuid? uuid}) : _uuid = uuid ?? const Uuid();

  final Uuid _uuid;

  final List<SensorSample> _samples = [];
  final List<OutletEvent> _outletEvents = [];
  final List<DehumidifierPullDownRecord> _dehuSegments = [];
  final List<HumidifierRampRecord> _humSegments = [];
  final List<GrowLogObserver> _observers = [];

  void addObserver(GrowLogObserver o) {
    if (!_observers.contains(o)) _observers.add(o);
  }

  void removeObserver(GrowLogObserver o) {
    _observers.remove(o);
  }

  void _notify(void Function(GrowLogObserver) fn) {
    for (final o in List<GrowLogObserver>.of(_observers)) {
      try {
        fn(o);
      } catch (e, st) {
        debugPrint('GrowLogRepository observer threw: $e\n$st');
      }
    }
  }

  static const int _maxSamplesMemory = 60000;
  static const int _maxOutletEvents = 15000;
  static const int _maxDehuSegments = 8000;
  static const int _maxHumSegments = 8000;

  Timer? _persistTimer;
  bool _dirty = false;
  bool _loaded = false;

  bool get isLoaded => _loaded;

  List<SensorSample> get samples => List.unmodifiable(_samples);
  List<OutletEvent> get outletEvents => List.unmodifiable(_outletEvents);
  List<DehumidifierPullDownRecord> get dehuSegments =>
      List.unmodifiable(_dehuSegments);
  List<HumidifierRampRecord> get humSegments =>
      List.unmodifiable(_humSegments);

  int get sampleCount => _samples.length;
  int get outletEventCount => _outletEvents.length;
  int get dehuRecordCount => _dehuSegments.length;

  String get storeSummary =>
      '$sampleCount telemetry samples · $outletEventCount relay events · '
      '$dehuRecordCount dehu segments · ${_humSegments.length} hum segments · '
      'persisted under app documents';

  Future<void> loadFromDisk() async {
    try {
      final file = await _storeFile();
      if (!await file.exists()) {
        _loaded = true;
        return;
      }
      final text = await file.readAsString();
      if (text.isEmpty) {
        _loaded = true;
        return;
      }
      final root = jsonDecode(text) as Map<String, dynamic>;
      final sa = root['samples'];
      if (sa is List) {
        for (final x in sa) {
          try {
            _samples.add(
              SensorSample.fromJson(Map<String, dynamic>.from(x as Map)),
            );
          } catch (_) {}
        }
      }
      final oe = root['outlets'];
      if (oe is List) {
        for (final x in oe) {
          try {
            _outletEvents.add(
              OutletEvent.fromJson(Map<String, dynamic>.from(x as Map)),
            );
          } catch (_) {}
        }
      }
      final dh = root['dehu'];
      if (dh is List) {
        for (final x in dh) {
          try {
            _dehuSegments.add(
              DehumidifierPullDownRecord.fromJson(
                Map<String, dynamic>.from(x as Map),
              ),
            );
          } catch (_) {}
        }
      }
      final hm = root['hum'];
      if (hm is List) {
        for (final x in hm) {
          try {
            _humSegments.add(
              HumidifierRampRecord.fromJson(
                Map<String, dynamic>.from(x as Map),
              ),
            );
          } catch (_) {}
        }
      }
      _samples.sort((a, b) => a.timestamp.compareTo(b.timestamp));
    } catch (e, st) {
      debugPrint('GrowLogRepository load: $e $st');
    }
    _loaded = true;
  }

  Future<File> _storeFile() async {
    final dir = await getApplicationDocumentsDirectory();
    final folder = Directory('${dir.path}/growcontrol');
    if (!await folder.exists()) await folder.create(recursive: true);
    return File('${folder.path}/telemetry_store.json');
  }

  void addSample(SensorSample s) {
    _samples.add(s);
    if (_samples.length > _maxSamplesMemory) {
      _samples.removeRange(0, _samples.length - _maxSamplesMemory);
    }
    _schedulePersist();
    _notify((o) => o.onSampleAdded(s));
  }

  void addOutletEvent(OutletEvent e) {
    _outletEvents.add(e);
    if (_outletEvents.length > _maxOutletEvents) {
      _outletEvents.removeRange(0, _outletEvents.length - _maxOutletEvents);
    }
    _schedulePersist();
    _notify((o) => o.onOutletEventAdded(e));
  }

  void addDehuSegment(DehumidifierPullDownRecord r) {
    _dehuSegments.add(r);
    if (_dehuSegments.length > _maxDehuSegments) {
      _dehuSegments.removeRange(0, _dehuSegments.length - _maxDehuSegments);
    }
    _schedulePersist();
    _notify((o) => o.onDehuSegmentAdded(r));
  }

  void addHumSegment(HumidifierRampRecord r) {
    _humSegments.add(r);
    if (_humSegments.length > _maxHumSegments) {
      _humSegments.removeRange(0, _humSegments.length - _maxHumSegments);
    }
    _schedulePersist();
    _notify((o) => o.onHumSegmentAdded(r));
  }

  void _schedulePersist() {
    _dirty = true;
    _persistTimer?.cancel();
    _persistTimer = Timer(const Duration(seconds: 2), () {
      unawaited(_persistNow());
    });
  }

  Future<void> _persistNow() async {
    if (!_dirty) return;
    _dirty = false;
    try {
      final file = await _storeFile();
      final payload = <String, dynamic>{
        'v': 1,
        'samples': _samples.map((s) => s.toJson()).toList(),
        'outlets': _outletEvents.map((e) => e.toJson()).toList(),
        'dehu': _dehuSegments.map((r) => r.toJson()).toList(),
        'hum': _humSegments.map((r) => r.toJson()).toList(),
      };
      await file.writeAsString(jsonEncode(payload));
    } catch (e, st) {
      debugPrint('GrowLogRepository persist: $e $st');
    }
  }

  /// Flush when app pauses (optional hook from WidgetsBindingObserver).
  Future<void> flush() async {
    _persistTimer?.cancel();
    await _persistNow();
  }

  List<SensorSample> samplesBetween(DateTime from, DateTime to) {
    final out = <SensorSample>[];
    for (final s in _samples) {
      if (!s.timestamp.isBefore(from) && !s.timestamp.isAfter(to)) {
        out.add(s);
      }
    }
    return out;
  }

  String nextId() => _uuid.v4();
}
