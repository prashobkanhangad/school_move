# School Bus Driver App

Flutter mobile app for school bus drivers.

## Features

- Driver login (JWT + secure token storage)
- View assigned bus and routes
- Start / end trip
- Live GPS sharing via Socket.IO (REST fallback)
- Emergency alert button
- Active trip status with route stops

## Prerequisites

- Flutter SDK 3.5+
- Running backend API (see `../backend`)

## Configuration

Default API URLs are set in `lib/core/config/app_config.dart`:

| Platform | API URL | Socket URL |
|----------|---------|------------|
| iOS Simulator | `http://localhost:5001/api/v1` | `http://localhost:5001` |
| Android Emulator | `http://10.0.2.2:5001/api/v1` | `http://10.0.2.2:5001` |
| Physical device | Your machine LAN IP | Your machine LAN IP |

Override at build/run time:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:5001/api/v1 \
  --dart-define=SOCKET_URL=http://10.0.2.2:5001
```

## Run

```bash
cd driver_app
flutter pub get
flutter run
```

## Demo Credentials

| Email | Password |
|-------|----------|
| `driver@greenvalley.edu` | `Driver@12345` |

## Project Structure

```
lib/
├── core/           # Config, theme, router, API client
├── features/       # Auth, home, active trip screens
└── shared/         # Models, services, providers
```

## Play Store

See [`../PLAY_STORE.md`](../PLAY_STORE.md) for signing, store listing, and AAB upload.

