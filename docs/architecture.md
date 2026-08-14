# School Bus Tracking Platform — System Architecture (MVP)

See the full architecture design in the project README. This document is a reference index.

## Stack

| Layer | Technology |
|-------|------------|
| Admin Web | React + TypeScript (Vercel) |
| Mobile | Flutter (Driver + Parent) |
| API | Node.js + Express + TypeScript (AWS EC2) |
| Database | MongoDB + Prisma |
| Auth | JWT + Refresh Token |
| Realtime | Socket.IO |
| Maps | Google Maps |
| Push | Firebase Cloud Messaging |
| Storage | AWS S3 |

## Applications

1. `admin-web` — School admin dashboard
2. `driver-app` — Driver mobile app
3. `parent-app` — Parent mobile app
4. `backend` — REST API + WebSocket server

## Backend Layers

```
presentation/   → routes, controllers, middleware, validators, socket handlers
application/    → services (business logic)
domain/         → entities, enums, repository interfaces
infrastructure/ → prisma repos, FCM, S3, Google Maps, Socket.IO
```

## Multi-Tenancy

All resources are scoped to `schoolId`. Repository methods always filter by school.

## Realtime Rooms

| Room | Purpose |
|------|---------|
| `school:{schoolId}` | Admin fleet monitoring |
| `trip:{tripId}` | Live bus tracking |
| `driver:{userId}` | Driver-specific events |
| `parent:{userId}` | Parent-specific events |

## Related Docs

- [API Specification](./api-spec.md)
- [Database Schema](./database.md)
