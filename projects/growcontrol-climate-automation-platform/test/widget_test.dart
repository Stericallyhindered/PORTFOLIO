import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:growcontrol/app.dart';
import 'package:growcontrol/services/climate_calibration_store.dart';
import 'package:growcontrol/services/grow_log_repository.dart';
import 'package:growcontrol/services/settings_repository.dart';
import 'package:growcontrol/services/traffic_logger.dart';
import 'fake_device_gateway.dart';

void main() {
  testWidgets('App builds', (WidgetTester tester) async {
    final log = GrowLogRepository();
    await log.loadFromDisk();
    final cal = ClimateCalibrationStore();
    await cal.load();
    final settings = SettingsRepository();
    await settings.load();
    final traffic = TrafficLogger();
    await tester.pumpWidget(
      GrowControlApp(
        log: log,
        calibration: cal,
        settings: settings,
        gateway: FakeDeviceGateway(),
        trafficLogger: traffic,
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(seconds: 2));
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
