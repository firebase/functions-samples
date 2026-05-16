import 'package:flutter_test/flutter_test.dart';
import 'package:codelab_dart_functions/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());
    expect(find.text('Multiplayer Counter'), findsOneWidget);
  });
}
