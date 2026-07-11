import 'package:flutter/material.dart';

import '../domain/mode_bundle.dart';
import '../domain/slip_resolve.dart';
import '../domain/telemetry_snapshot.dart';
import '../domain/torque_estimate.dart';

Color heatmapColor(double pwm, double maxPwm) {
  final t = (pwm / maxPwm).clamp(0.0, 1.0);
  return Color.lerp(
    const Color(0xFF0D4D0D),
    const Color(0xFF8B1A1A),
    t,
  )!;
}

/// Map cell indices: `i` = slip row (\(Y\) axis), `j` = torque column (\(X\) axis).
(int i, int j)? cursorCell({
  required double? torqueNm,
  required TelemetrySnapshot? snap,
  required ModeBundle bundle,
}) {
  if (torqueNm == null || snap == null) return null;
  final slipY = resolveSlipScalar(snap, bundle.slipInputMode);
  if (slipY == null) return null;
  final tx = bundle.xAxis.breakpoints;
  final sy = bundle.yAxis.breakpoints;
  if (tx.length < 2 || sy.length < 2) return null;
  if (torqueNm < tx.first ||
      torqueNm > tx.last ||
      slipY < sy.first ||
      slipY > sy.last) {
    return null;
  }
  var jSel = -1;
  var iSel = -1;
  for (var j = 0; j < tx.length - 1; j++) {
    if (torqueNm >= tx[j] && torqueNm <= tx[j + 1]) {
      jSel = j;
      break;
    }
  }
  if (jSel < 0) return null;
  for (var i = 0; i < sy.length - 1; i++) {
    if (slipY >= sy[i] && slipY <= sy[i + 1]) {
      iSel = i;
      break;
    }
  }
  if (iSel < 0) return null;
  return (iSel, jSel);
}

double? effectiveTorqueIn(TelemetrySnapshot s, ModeBundle b) {
  if (b.useTorqueEstimate) {
    final tps = s.tpsPercent;
    if (tps == null || s.engineRpm == null) return null;
    return torqueEstimateTpsMaxRpm(
      tpsPercent: tps,
      maxTorqueNm: b.maxTorqueEstimateNm,
      rpmBreakpoints: b.rpmBreakpoints,
      rpmFactors: b.rpmFactors,
      rpm: s.engineRpm!,
    );
  }
  return s.engineTorqueNm;
}
