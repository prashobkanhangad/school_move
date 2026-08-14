# Database Schema Reference

Full Prisma schema lives in `backend/prisma/schema.prisma` (created in Step 4).

## Core Entities

| Model | Purpose |
|-------|---------|
| `School` | Tenant root |
| `User` | Auth + role (ADMIN, DRIVER, PARENT) |
| `DriverProfile` | Driver-specific data |
| `ParentProfile` | Parent-specific data |
| `Bus` | Fleet vehicles |
| `Route` | Bus routes |
| `RouteStop` | Ordered stops with geofence radius |
| `Student` | Enrolled children |
| `StudentRouteAssignment` | Student → route + pickup/drop stops |
| `Trip` | Active/completed journeys |
| `LocationLog` | GPS history (TTL 7 days) |
| `TripStopEvent` | Geofence event log (idempotency) |
| `EmergencyAlert` | Driver emergency records |
| `Notification` | Push/in-app notification log |
| `RefreshToken` | JWT refresh token store |
| `DeviceToken` | FCM device tokens |

## Key Indexes

- `User(schoolId, role)`
- `Trip(schoolId, status)`
- `LocationLog(tripId, recordedAt)`
- `Notification(userId, status)`

## Business Rules

1. One active trip per bus
2. One active trip per driver
3. GPS updates only on ACTIVE trips
4. Geofence notifications fire once per stop event (via TripStopEvent)
