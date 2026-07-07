import 'package:flutter_test/flutter_test.dart';

import 'package:app/main.dart';

void main() {
  testWidgets('phase one shell renders primary navigation', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const TurboLamikPhaseOneApp());
    await tester.pump(const Duration(milliseconds: 150));

    expect(find.text('Live Dashboard'), findsWidgets);
    expect(find.text('Raw Frames'), findsOneWidget);
    expect(find.text('BMW E90 AWD + TurboLamik Phase 1'), findsOneWidget);
  });
}
