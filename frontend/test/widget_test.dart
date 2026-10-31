import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/main.dart';

void main() {
  testWidgets('MediRoute Driver smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const MediRouteDriverApp(hasSession: false));
    expect(find.text('MediRoute Driver'), findsOneWidget);
  });
}
