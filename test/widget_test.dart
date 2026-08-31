import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:textshop/app/app.dart';

void main() {
  testWidgets('renders TextShop home', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: TextShopApp()));
    await tester.pumpAndSettle();

    expect(find.text('TextShop'), findsOneWidget);
    expect(find.text('Featured products'), findsOneWidget);
  });
}
