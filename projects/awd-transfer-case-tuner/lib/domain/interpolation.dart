import 'axis_definition.dart';
import 'bias_map_2d.dart';

double clampDouble(double v, double lo, double hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

/// Bilinear interpolation on map cells. Axes are edges: N breakpoints -> N-1 cells.
double bilinearInterp({
  required double torqueIn,
  required double slipIn,
  required AxisDefinition torqueAxis,
  required AxisDefinition slipAxis,
  required BiasMap2D map,
}) {
  final tx = torqueAxis.breakpoints;
  final sy = slipAxis.breakpoints;
  if (tx.length < 2 || sy.length < 2) return 0;
  if (map.rows != sy.length - 1 || map.cols != tx.length - 1) {
    throw ArgumentError('Map shape ${map.rows}x${map.cols} does not match axes '
        '(${sy.length - 1}x${tx.length - 1}).');
  }

  final tClamped = clampDouble(torqueIn, tx.first, tx.last);
  final sClamped = clampDouble(slipIn, sy.first, sy.last);

  var j = _findInterval(tx, tClamped);
  var i = _findInterval(sy, sClamped);
  j = j.clamp(0, tx.length - 2);
  i = i.clamp(0, sy.length - 2);

  final t0 = tx[j];
  final t1 = tx[j + 1];
  final s0 = sy[i];
  final s1 = sy[i + 1];

  final denomT = (t1 - t0).abs() < 1e-9 ? 1.0 : (t1 - t0);
  final denomS = (s1 - s0).abs() < 1e-9 ? 1.0 : (s1 - s0);

  final tt = ((tClamped - t0) / denomT).clamp(0.0, 1.0);
  final ss = ((sClamped - s0) / denomS).clamp(0.0, 1.0);

  final m00 = map.cells[i][j];
  final m10 = map.cells[i][j + 1];
  final m01 = map.cells[i + 1][j];
  final m11 = map.cells[i + 1][j + 1];

  return (1 - tt) * (1 - ss) * m00 +
      tt * (1 - ss) * m10 +
      (1 - tt) * ss * m01 +
      tt * ss * m11;
}

int _findInterval(List<double> bp, double v) {
  if (v <= bp.first) return 0;
  if (v >= bp.last) return bp.length - 2;
  for (var k = 0; k < bp.length - 1; k++) {
    if (v >= bp[k] && v <= bp[k + 1]) return k;
  }
  return bp.length - 2;
}

/// Piecewise-linear interpolation on sorted breakpoints (for \(f(\mathrm{RPM})\), etc.).
double interpolatePiecewise(List<double> xs, List<double> ys, double x) {
  if (xs.isEmpty || ys.isEmpty || xs.length != ys.length) return 1.0;
  if (xs.length == 1) return ys.first;
  final xc = clampDouble(x, xs.first, xs.last);
  for (var i = 0; i < xs.length - 1; i++) {
    if (xc >= xs[i] && xc <= xs[i + 1]) {
      final t = (xc - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys.last;
}
