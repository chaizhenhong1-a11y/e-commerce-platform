# Elvane Firebase Cloud Messaging setup

Phase 050.2 keeps Firebase credentials out of the repository. The code can run
without Firebase native configuration, but real Android/iOS push delivery only
starts after the Firebase apps are configured locally/deployed.

## 1. Configure the Flutter Firebase apps

From `apps/mobile`, install/use FlutterFire CLI and run:

```powershell
flutterfire configure
```

Select the Firebase project used for Elvane and configure Android and iOS.
Do not commit private service-account credentials. Native client Firebase
configuration files are application configuration, while backend service-account
JSON is a server secret and must remain outside Git.

## 2. Backend FCM HTTP v1 credentials

The NestJS API uses Google Application Default Credentials through
`google-auth-library`. Configure a service account that can send Firebase Cloud
Messaging messages and set its local/deployment credential path through
`GOOGLE_APPLICATION_CREDENTIALS`.

Then set in `services/api/.env`:

```env
PUSH_ENABLED=true
PUSH_DELIVERY_MODE=FCM
FCM_PROJECT_ID=your-firebase-project-id
```

For development without real delivery, keep:

```env
PUSH_ENABLED=true
PUSH_DELIVERY_MODE=CONSOLE
```

## 3. Flutter behavior

After Firebase is configured, the app automatically:

- initializes Firebase without blocking startup if Firebase is unavailable;
- requests notification permission after an authenticated account is available;
- registers the FCM token against the signed-in Elvane account;
- re-registers token rotations;
- disables the current device token during logout;
- refreshes the in-app notification feed on foreground messages;
- routes notification taps to the server-provided `actionPath` or order detail;
- handles notification taps from background and terminated launches.

`PUSH_ENABLED` on Flutter defaults to true in Phase 050.2. It can still be
disabled for a build with `--dart-define=PUSH_ENABLED=false`.
