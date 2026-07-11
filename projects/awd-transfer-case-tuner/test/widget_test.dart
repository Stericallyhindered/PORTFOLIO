import 'package:awd_tuner/awd_app.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App loads tuning rail', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: AwdApp()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Tuning'), findsOneWidget);
  });
}
