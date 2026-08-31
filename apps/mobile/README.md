# TextShop Mobile

Flutter customer app for Android and iOS.

The mobile app consumes the same TextShop API as the Next.js storefront. It must never connect directly to PostgreSQL.

## Setup

```bash
flutter create . --platforms=android,ios
flutter pub get
dart format lib test
flutter analyze
flutter test
```

Run against a local API using an address reachable by the device/emulator:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```


## API configuration

Android Emulator uses the host API at `http://10.0.2.2:3001` by default.

For a physical Android or iOS device, run with the development machine LAN IP:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3001
```

The phone and development machine must be on the same reachable network, and the API/firewall must allow the connection.

## Mobile checkout

The Flutter client now creates real orders through `POST /checkout`, using the
same cart, inventory reservation, customer address, and account identity as the
storefront. In debug builds, `MANUAL_TEST` is available for local end-to-end
payment testing. Stripe opens the provider-hosted checkout page externally.

After a pending order is created, inventory remains reserved for the existing
30-minute reservation window. Android/iOS and Flutter Web development all use
the same NestJS payment API.
