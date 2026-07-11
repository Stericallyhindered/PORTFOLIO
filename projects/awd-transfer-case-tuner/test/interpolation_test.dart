import 'package:awd_tuner/domain/axis_definition.dart';
import 'package:awd_tuner/domain/bias_map_2d.dart';
import 'package:awd_tuner/domain/interpolation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('bilinear corner M00', () {
    final tx = AxisDefinition(label: 'T', unit: 'Nm', breakpoints: [0, 100, 200]);
    final sy = AxisDefinition(label: 'S', unit: 'kph', breakpoints: [0, 10, 20]);
    final map = BiasMap2D(cells: [
      [10, 20],
      [30, 40],
    ]);
    final v = bilinearInterp(
      torqueIn: 0,
      slipIn: 0,
      torqueAxis: tx,
      slipAxis: sy,
      map: map,
    );
    expect(v, 10);
  });

  test('bilinear center of first cell', () {
    final tx = AxisDefinition(label: 'T', unit: 'Nm', breakpoints: [0, 100, 200]);
    final sy = AxisDefinition(label: 'S', unit: 'kph', breakpoints: [0, 10, 20]);
    final map = BiasMap2D(cells: [
      [0, 100],
      [100, 0],
    ]);
    final v = bilinearInterp(
      torqueIn: 50,
      slipIn: 5,
      torqueAxis: tx,
      slipAxis: sy,
      map: map,
    );
    expect(v, closeTo(50, 0.001));
  });
}
