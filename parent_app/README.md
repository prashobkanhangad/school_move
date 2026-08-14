# School Bus Parent App

Flutter mobile app for parents to track their child's school bus.

## Features

- Parent login (JWT + secure storage)
- View children with assigned bus and route
- Live bus tracking on Google Maps (WebSocket)
- ETA to pickup stop
- Push-style in-app notifications (pickup, drop, trip, emergency)
- Emergency alert dialog

## Prerequisites

- Flutter SDK 3.5+
- Running backend API (see `../backend`)
- Google Maps API key (for map view)

## Configuration

| Platform | API URL | Socket URL |
|----------|---------|------------|
| iOS Simulator | `http://localhost:5001/api/v1` | `http://localhost:5001` |
| Android Emulator | `http://10.0.2.2:5001/api/v1` | `http://10.0.2.2:5001` |
| Physical device | Your machine LAN IP | Your machine LAN IP |

### Google Maps

1. Copy `android/key.properties.example` to `android/key.properties`
2. Set `GOOGLE_MAPS_API_KEY` to the same key used in admin-web (enable **Maps SDK for Android** in Google Cloud Console)

**Android** reads the key from `android/key.properties` automatically.

**iOS:** Add to `ios/Runner/AppDelegate.swift`:
```swift
GMSServices.provideAPIKey("YOUR_KEY")
```

## Run

```bash
cd parent_app
flutter pub get
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:5001/api/v1 \
  --dart-define=SOCKET_URL=http://10.0.2.2:5001 \
  --dart-define=GOOGLE_MAPS_API_KEY=your_key
```

## Demo Credentials

| Email | Password |
|-------|----------|
| `parent@email.com` | `Parent@12345` |

## Project Structure

```
lib/
├── core/           # Config, theme, router, API client
├── features/       # Auth, home, tracking, notifications
└── shared/         # Models, services, providers
```

## User Flow

```
Login → My Children → Tap child → Live Map + ETA
                              → Notifications (pickup/drop/emergency)
```

## Play Store

See [`../PLAY_STORE.md`](../PLAY_STORE.md) for signing, store listing, and AAB upload.

