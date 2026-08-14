import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:driver_app/main.dart';

void main() {
  testWidgets('Driver app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: DriverApp()));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(find.byType(DriverApp), findsOneWidget);
  });
}
