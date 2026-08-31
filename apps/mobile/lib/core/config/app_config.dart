abstract final class AppConfig {
  static const String appName = 'TextShop';

  /// Android Emulator reaches the host machine through 10.0.2.2.
  ///
  /// For a physical device, pass the development machine LAN address:
  /// flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3001
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );
}
