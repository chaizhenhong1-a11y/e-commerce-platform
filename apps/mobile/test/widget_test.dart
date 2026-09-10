import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:elvane/app/app.dart';

void main() {
  testWidgets('renders Elvane home', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: ElvaneApp()));
    await tester.pumpAndSettle();

    expect(find.text('Elvane'), findsOneWidget);
    expect(find.text('Featured products'), findsOneWidget);
  });
}
