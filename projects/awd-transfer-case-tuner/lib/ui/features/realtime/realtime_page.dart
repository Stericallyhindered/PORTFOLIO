import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../../../domain/pwm_engine.dart';
import '../../../domain/telemetry_snapshot.dart';
import '../../../providers/app_providers.dart';
import '../../../providers/pwm_live.dart';

class RealtimePage extends ConsumerWidget {
  const RealtimePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(telemetryProvider, (previous, next) {
      final snap = next.asData?.value;
      if (snap != null) {
        ref.read(pwmLiveProvider.notifier).onTelemetry(snap);
      }
    });

    ref.listen(selectedModeProvider, (previous, next) {
      if (previous != next) {
        ref.read(pwmLiveProvider.notifier).resetSlew();
      }
    });

    final tel = ref.watch(telemetryProvider);
    final snap = tel.asData?.value;
    final computed = ref.watch(pwmLiveProvider);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Realtime', style: Theme.of(context).textTheme.headlineSmall),
              const Spacer(),
              TextButton.icon(
                onPressed: snap == null
                    ? null
                    : () => _appendCsv(snap, computed),
                icon: const Icon(Icons.fiber_manual_record),
                label: const Text('Append CSV row'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (snap == null)
            const Expanded(
              child: Center(
                child: Text(
                  'No telemetry — connect over BLE and decode characteristics before frames appear.',
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else
            Expanded(
              child: ListView(
                children: [
                  _tile('Engine RPM', snap.engineRpm?.toStringAsFixed(0) ?? '—'),
                  _tile('Torque Nm', snap.engineTorqueNm?.toStringAsFixed(0) ?? '—'),
                  _tile('TPS %', snap.tpsPercent?.toStringAsFixed(0) ?? '—'),
                  _tile('Wheel FL', snap.vFl?.toStringAsFixed(1) ?? '—'),
                  _tile('Wheel FR', snap.vFr?.toStringAsFixed(1) ?? '—'),
                  _tile('Wheel RL', snap.vRl?.toStringAsFixed(1) ?? '—'),
                  _tile('Wheel RR', snap.vRr?.toStringAsFixed(1) ?? '—'),
                  _tile('Slip R−F', snap.slipKmh?.toStringAsFixed(2) ?? '—'),
                  _tile('Gear', snap.gear?.toString() ?? '—'),
                  _tile('Steer °', snap.steeringAngleDeg?.toStringAsFixed(1) ?? '—'),
                  _tile('Yaw °/s', snap.yawDegPerSec?.toStringAsFixed(1) ?? '—'),
                  _tile('Ay g', snap.lateralAccelG?.toStringAsFixed(2) ?? '—'),
                  _tile('V km/h', snap.vehicleSpeedKmh?.toStringAsFixed(0) ?? '—'),
                  const Divider(),
                  Text(
                    'PWM pipeline (same order as engine)',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  _tile('PWM map (bilinear)', _fmt(computed?.pwmMap)),
                  _tile('PWM pred (pre-control)', _fmt(computed?.pwmPred)),
                  _tile('PWM after α-blend', _fmt(computed?.pwmAfterAlpha)),
                  _tile('PWM after dynamics+tire', _fmt(computed?.pwmAfterDynamics)),
                  _tile('PWM after gear×steer+clamp', _fmt(computed?.pwmAfterGearSteerClamp)),
                  _tile('PWM after drag gate', _fmt(computed?.pwmAfterDragGate)),
                  _tile('PWM after PDF hard gates', _fmt(computed?.pwmAfterPdfGates)),
                  _tile(
                    'PWM final (slew)',
                    computed == null ? '—' : computed.pwm.toStringAsFixed(1),
                  ),
                  _tile(
                    'Effective lock %',
                    computed == null ? '—' : computed.effectiveLockPercent.toStringAsFixed(0),
                  ),
                  _tile(
                    'Inputs valid',
                    computed?.inputsValid.toString() ?? '—',
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _tile(String k, String v) {
    return ListTile(
      dense: true,
      title: Text(k),
      trailing: Text(
        v,
        style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
      ),
    );
  }

  static String _fmt(double? x, [int d = 1]) {
    if (x == null) return '—';
    return x.toStringAsFixed(d);
  }

  static Future<void> _appendCsv(
    TelemetrySnapshot snap,
    PwmComputeResult? computed,
  ) async {
    final dir = await getApplicationDocumentsDirectory();
    final f = File('${dir.path}/awd_realtime_log.csv');
    final exists = await f.exists();
    if (!exists) {
      await f.writeAsString(
        'rpm,torque,tps,slip_kmh,ay_g,v_kmh,pwm_map,pwm_pred,pwm_alpha,pwm_dyn,pwm_gear_clamp,pwm_drag,pwm_pdf_gates,pwm_final,effLock\n',
      );
    }
    final line =
        '${snap.engineRpm ?? ""},${snap.engineTorqueNm ?? ""},${snap.tpsPercent ?? ""},${snap.slipKmh ?? ""},${snap.lateralAccelG ?? ""},${snap.vehicleSpeedKmh ?? ""},${computed?.pwmMap ?? ""},${computed?.pwmPred ?? ""},${computed?.pwmAfterAlpha ?? ""},${computed?.pwmAfterDynamics ?? ""},${computed?.pwmAfterGearSteerClamp ?? ""},${computed?.pwmAfterDragGate ?? ""},${computed?.pwmAfterPdfGates ?? ""},${computed?.pwm ?? ""},${computed?.effectiveLockPercent ?? ""}\n';
    await f.writeAsString(line, mode: FileMode.append);
  }
}
