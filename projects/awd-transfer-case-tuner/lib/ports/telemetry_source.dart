import '../domain/telemetry_snapshot.dart';

abstract class TelemetrySource {
  Stream<TelemetrySnapshot>? get stream;

  /// Whether live telemetry frames are expected (connected + codec active).
  bool get isLive;

  void dispose();
}
