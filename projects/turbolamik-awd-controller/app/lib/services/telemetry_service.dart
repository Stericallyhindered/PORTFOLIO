import 'package:flutter/foundation.dart';

import '../models/capture_control.dart';
import '../models/health_status.dart';
import '../models/live_snapshot.dart';
import '../models/raw_can_frame.dart';
import '../models/saved_capture.dart';
import '../models/vehicle_profile.dart';

abstract class TelemetryService extends ChangeNotifier {
  VehicleProfile get profile;
  LiveSnapshot get snapshot;
  HealthStatus get health;
  CaptureControl get captureControl;
  List<RawCanFrame> get latestFrames;
  List<SavedCapture> get savedCaptures;

  bool get isDemoMode;
  String get modeLabel;

  void start();
  void shutdown();
  void setCaptureFilter(CaptureFilterMode mode);
  void startCapture();
  void stopCapture();
  void clearSavedCaptures();
  void deleteSavedCapture(SavedCapture capture);
}
