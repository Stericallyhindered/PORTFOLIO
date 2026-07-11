import 'dart:math' as math;

import 'slip_input_mode.dart';
import 'telemetry_snapshot.dart';

/// PDF traction layer uses wheel-speed-derived slip; pick formulation to match Y-axis units.
double? resolveSlipScalar(TelemetrySnapshot s, SlipInputMode mode) {
  if (!s.hasWheelSpeeds) return null;
  final vf = (s.vFl! + s.vFr!) / 2.0;
  final vr = (s.vRl! + s.vRr!) / 2.0;
  final delta = vr - vf;
  switch (mode) {
    case SlipInputMode.kmhRearMinusFront:
      return delta;
    case SlipInputMode.normalizedByRear:
      final denom = math.max(vr.abs(), 1.0);
      return delta / denom;
    case SlipInputMode.normalizedByVehicleSpeed:
      final vv = s.vehicleSpeedKmh ?? ((vf + vr) / 2.0);
      final denom = math.max(vv.abs(), 1.0);
      return delta / denom;
  }
}
