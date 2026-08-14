# School Bus Tracking Platform — API Specification (MVP)

**Version:** 1.0.0  
**Base URL:** `https://api.{domain}/api/v1`  
**Realtime URL:** `wss://api.{domain}`  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Schools](#3-schools)
4. [Users & Drivers](#4-users--drivers)
5. [Parents](#5-parents)
6. [Buses](#6-buses)
7. [Routes & Stops](#7-routes--stops)
8. [Students & Assignments](#8-students--assignments)
9. [Trips & GPS Tracking](#9-trips--gps-tracking)
10. [ETA](#10-eta)
11. [Emergency Alerts](#11-emergency-alerts)
12. [Notifications](#12-notifications)
13. [Live Monitoring (Admin)](#13-live-monitoring-admin)
14. [File Uploads](#14-file-uploads)
15. [Socket.IO Events](#15-socketio-events)
16. [Error Codes](#16-error-codes)

---

## 1. Conventions

### 1.1 Response Envelope

**Success**
```json
{
  "success": true,
  "data": {},
  "message": "Optional human-readable message"
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### 1.2 Pagination

Query params: `page` (default: 1), `limit` (default: 20, max: 100)

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 1.3 Authentication Header

```
Authorization: Bearer <access_token>
```

### 1.4 Roles

| Role | Description |
|------|-------------|
| `SCHOOL_ADMIN` | Full school management |
| `DRIVER` | Trip operations & GPS |
| `PARENT` | Child bus tracking |

### 1.5 Common HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation / bad request |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden / insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate, active trip exists) |
| 422 | Business rule violation |
| 429 | Rate limited |
| 500 | Internal server error |

---

## 2. Authentication

### 2.1 Login

`POST /auth/login`

**Access:** Public

**Request**
```json
{
  "email": "admin@school.com",
  "password": "SecurePass123!"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "665f1a2b3c4d5e6f7a8b9c0d",
      "email": "admin@school.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "SCHOOL_ADMIN",
      "schoolId": "665f1a2b3c4d5e6f7a8b9c01",
      "avatarUrl": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "d8f7e6c5b4a39281...",
      "expiresIn": 900
    }
  }
}
```

---

### 2.2 Refresh Token

`POST /auth/refresh`

**Access:** Public (requires valid refresh token)

**Request**
```json
{
  "refreshToken": "d8f7e6c5b4a39281..."
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "new_rotated_refresh_token...",
    "expiresIn": 900
  }
}
```

---

### 2.3 Logout

`POST /auth/logout`

**Access:** Authenticated

**Request**
```json
{
  "refreshToken": "d8f7e6c5b4a39281..."
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2.4 Get Current User

`GET /auth/me`

**Access:** Authenticated (all roles)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "email": "admin@school.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+911234567890",
    "role": "SCHOOL_ADMIN",
    "status": "ACTIVE",
    "schoolId": "665f1a2b3c4d5e6f7a8b9c01",
    "avatarUrl": null,
    "school": {
      "id": "665f1a2b3c4d5e6f7a8b9c01",
      "name": "Green Valley School",
      "code": "GVS001"
    },
    "driverProfile": null,
    "parentProfile": null
  }
}
```

---

### 2.5 Register FCM Device Token

`POST /auth/device-token`

**Access:** Authenticated (all roles)

**Request**
```json
{
  "fcmToken": "fcm_device_token_string",
  "platform": "android"
}
```

`platform`: `ios` | `android` | `web`

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c02",
    "platform": "android"
  },
  "message": "Device token registered"
}
```

---

### 2.6 Remove FCM Device Token

`DELETE /auth/device-token`

**Access:** Authenticated

**Request**
```json
{
  "fcmToken": "fcm_device_token_string"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Device token removed"
}
```

---

## 3. Schools

> **Note:** For MVP, each admin belongs to one school. School CRUD is primarily for initial setup / platform bootstrap.

### 3.1 Create School

`POST /schools`

**Access:** `SCHOOL_ADMIN` (bootstrap) or internal seed script

**Request**
```json
{
  "name": "Green Valley School",
  "code": "GVS001",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "IN",
  "phone": "+911234567890",
  "email": "contact@greenvalley.edu",
  "timezone": "Asia/Kolkata"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c01",
    "name": "Green Valley School",
    "code": "GVS001",
    "isActive": true,
    "createdAt": "2026-06-21T10:00:00.000Z"
  }
}
```

---

### 3.2 Get School

`GET /schools/:schoolId`

**Access:** `SCHOOL_ADMIN` (own school only)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c01",
    "name": "Green Valley School",
    "code": "GVS001",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "IN",
    "phone": "+911234567890",
    "email": "contact@greenvalley.edu",
    "logoUrl": null,
    "timezone": "Asia/Kolkata",
    "isActive": true
  }
}
```

---

### 3.3 Update School

`PATCH /schools/:schoolId`

**Access:** `SCHOOL_ADMIN` (own school)

**Request** (partial)
```json
{
  "name": "Green Valley International School",
  "phone": "+919876543210",
  "logoUrl": "https://cdn.example.com/logos/gvs.png"
}
```

**Response `200`** — returns updated school object.

---

### 3.4 List Schools

`GET /schools`

**Access:** Internal / future super-admin. **Not exposed in MVP UI.**

---

## 4. Users & Drivers

### 4.1 Create Driver

`POST /drivers`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "email": "driver@school.com",
  "password": "SecurePass123!",
  "firstName": "Raj",
  "lastName": "Kumar",
  "phone": "+919876543210",
  "licenseNumber": "MH-12-2020-1234567",
  "licenseExpiry": "2028-12-31T00:00:00.000Z"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c10",
    "email": "driver@school.com",
    "firstName": "Raj",
    "lastName": "Kumar",
    "role": "DRIVER",
    "status": "ACTIVE",
    "driverProfile": {
      "id": "665f1a2b3c4d5e6f7a8b9c11",
      "licenseNumber": "MH-12-2020-1234567",
      "isAvailable": true
    }
  }
}
```

---

### 4.2 List Drivers

`GET /drivers`

**Access:** `SCHOOL_ADMIN`

**Query params:** `page`, `limit`, `status`, `search`, `isAvailable`

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "665f1a2b3c4d5e6f7a8b9c10",
        "firstName": "Raj",
        "lastName": "Kumar",
        "email": "driver@school.com",
        "phone": "+919876543210",
        "status": "ACTIVE",
        "driverProfile": {
          "licenseNumber": "MH-12-2020-1234567",
          "isAvailable": true
        },
        "assignedBus": {
          "id": "665f1a2b3c4d5e6f7a8b9c20",
          "plateNumber": "MH-01-AB-1234"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

---

### 4.3 Get Driver

`GET /drivers/:driverId`

**Access:** `SCHOOL_ADMIN`, `DRIVER` (own profile)

---

### 4.4 Update Driver

`PATCH /drivers/:driverId`

**Access:** `SCHOOL_ADMIN`

**Request** (partial)
```json
{
  "firstName": "Rajesh",
  "phone": "+919111111111",
  "status": "ACTIVE",
  "licenseExpiry": "2029-06-30T00:00:00.000Z",
  "isAvailable": true
}
```

---

### 4.5 Deactivate Driver

`DELETE /drivers/:driverId`

**Access:** `SCHOOL_ADMIN`

Soft-deactivates user (`status: INACTIVE`). Fails if driver has an active trip.

**Response `200`**
```json
{
  "success": true,
  "message": "Driver deactivated successfully"
}
```

---

## 5. Parents

### 5.1 Create Parent

`POST /parents`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "email": "parent@email.com",
  "password": "SecurePass123!",
  "firstName": "Priya",
  "lastName": "Sharma",
  "phone": "+919999999999",
  "address": "45 Park Avenue, Mumbai"
}
```

**Response `201`** — returns user + `parentProfile`.

---

### 5.2 List Parents

`GET /parents`

**Access:** `SCHOOL_ADMIN`

**Query params:** `page`, `limit`, `search`, `status`

---

### 5.3 Get Parent

`GET /parents/:parentId`

**Access:** `SCHOOL_ADMIN`, `PARENT` (own profile)

**Response `200`** includes linked `students` array.

---

### 5.4 Update Parent

`PATCH /parents/:parentId`

**Access:** `SCHOOL_ADMIN`, `PARENT` (own — limited fields: phone, address, avatarUrl)

---

## 6. Buses

### 6.1 Create Bus

`POST /buses`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "plateNumber": "MH-01-AB-1234",
  "model": "Tata Starbus",
  "capacity": 40,
  "driverId": "665f1a2b3c4d5e6f7a8b9c10"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c20",
    "plateNumber": "MH-01-AB-1234",
    "model": "Tata Starbus",
    "capacity": 40,
    "status": "ACTIVE",
    "driver": {
      "id": "665f1a2b3c4d5e6f7a8b9c10",
      "firstName": "Raj",
      "lastName": "Kumar"
    }
  }
}
```

---

### 6.2 List Buses

`GET /buses`

**Access:** `SCHOOL_ADMIN`

**Query params:** `page`, `limit`, `status`, `search`

---

### 6.3 Get Bus

`GET /buses/:busId`

**Access:** `SCHOOL_ADMIN`, `DRIVER` (assigned bus), `PARENT` (child's assigned bus)

---

### 6.4 Update Bus

`PATCH /buses/:busId`

**Access:** `SCHOOL_ADMIN`

**Request** (partial)
```json
{
  "model": "Tata Starbus Ultra",
  "capacity": 45,
  "status": "MAINTENANCE",
  "driverId": "665f1a2b3c4d5e6f7a8b9c10"
}
```

---

### 6.5 Delete Bus

`DELETE /buses/:busId`

**Access:** `SCHOOL_ADMIN`

Soft-delete / set `status: INACTIVE`. Fails if bus has active trip.

---

## 7. Routes & Stops

### 7.1 Create Route

`POST /routes`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "name": "Route A - North Zone",
  "description": "Covers Andheri to Bandra",
  "busId": "665f1a2b3c4d5e6f7a8b9c20",
  "startTime": "07:30",
  "stops": [
    {
      "name": "Andheri Station",
      "address": "Andheri West, Mumbai",
      "latitude": 19.1197,
      "longitude": 72.8468,
      "stopOrder": 1,
      "stopType": "PICKUP",
      "radiusM": 100
    },
    {
      "name": "Bandra West",
      "address": "Bandra West, Mumbai",
      "latitude": 19.0596,
      "longitude": 72.8295,
      "stopOrder": 2,
      "stopType": "DROP",
      "radiusM": 100
    }
  ]
}
```

**Response `201`** — returns route with nested `stops`.

---

### 7.2 List Routes

`GET /routes`

**Access:** `SCHOOL_ADMIN`, `DRIVER`

**Query params:** `page`, `limit`, `status`, `busId`, `search`

---

### 7.3 Get Route

`GET /routes/:routeId`

**Access:** `SCHOOL_ADMIN`, `DRIVER` (assigned), `PARENT` (child's route)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c30",
    "name": "Route A - North Zone",
    "status": "ACTIVE",
    "startTime": "07:30",
    "bus": {
      "id": "665f1a2b3c4d5e6f7a8b9c20",
      "plateNumber": "MH-01-AB-1234"
    },
    "stops": [
      {
        "id": "665f1a2b3c4d5e6f7a8b9c31",
        "name": "Andheri Station",
        "latitude": 19.1197,
        "longitude": 72.8468,
        "stopOrder": 1,
        "stopType": "PICKUP",
        "radiusM": 100
      }
    ],
    "studentCount": 12
  }
}
```

---

### 7.4 Update Route

`PATCH /routes/:routeId`

**Access:** `SCHOOL_ADMIN`

**Request** (partial — metadata only; use stop endpoints for stops)
```json
{
  "name": "Route A - Updated",
  "busId": "665f1a2b3c4d5e6f7a8b9c20",
  "status": "ACTIVE",
  "startTime": "07:15"
}
```

---

### 7.5 Delete Route

`DELETE /routes/:routeId`

**Access:** `SCHOOL_ADMIN`

Sets `status: INACTIVE`. Fails if route has active trip.

---

### 7.6 Add Stop to Route

`POST /routes/:routeId/stops`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "name": "Juhu Circle",
  "address": "Juhu, Mumbai",
  "latitude": 19.1073,
  "longitude": 72.8263,
  "stopOrder": 3,
  "stopType": "BOTH",
  "radiusM": 150
}
```

---

### 7.7 Update Stop

`PATCH /routes/:routeId/stops/:stopId`

**Access:** `SCHOOL_ADMIN`

---

### 7.8 Delete Stop

`DELETE /routes/:routeId/stops/:stopId`

**Access:** `SCHOOL_ADMIN`

Fails if students are assigned to this stop.

---

### 7.9 Reorder Stops

`PUT /routes/:routeId/stops/reorder`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "stopOrders": [
    { "stopId": "665f1a2b3c4d5e6f7a8b9c31", "stopOrder": 1 },
    { "stopId": "665f1a2b3c4d5e6f7a8b9c32", "stopOrder": 2 }
  ]
}
```

---

## 8. Students & Assignments

### 8.1 Create Student

`POST /students`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "parentId": "665f1a2b3c4d5e6f7a8b9c40",
  "firstName": "Aarav",
  "lastName": "Sharma",
  "grade": "5",
  "section": "A"
}
```

---

### 8.2 List Students

`GET /students`

**Access:** `SCHOOL_ADMIN`

**Query params:** `page`, `limit`, `search`, `grade`, `parentId`, `routeId`, `isActive`

---

### 8.3 Get Student

`GET /students/:studentId`

**Access:** `SCHOOL_ADMIN`, `PARENT` (own child)

---

### 8.4 Update Student

`PATCH /students/:studentId`

**Access:** `SCHOOL_ADMIN`

---

### 8.5 Deactivate Student

`DELETE /students/:studentId`

**Access:** `SCHOOL_ADMIN`

Sets `isActive: false` and deactivates route assignments.

---

### 8.6 Assign Student to Route

`POST /students/:studentId/assignments`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "routeId": "665f1a2b3c4d5e6f7a8b9c30",
  "pickupStopId": "665f1a2b3c4d5e6f7a8b9c31",
  "dropStopId": "665f1a2b3c4d5e6f7a8b9c32"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c50",
    "studentId": "665f1a2b3c4d5e6f7a8b9c45",
    "routeId": "665f1a2b3c4d5e6f7a8b9c30",
    "pickupStop": { "id": "...", "name": "Andheri Station" },
    "dropStop": { "id": "...", "name": "Bandra West" },
    "status": "ACTIVE"
  }
}
```

**Business rules:**
- Stops must belong to the specified route
- Deactivates any previous active assignment for the student

---

### 8.7 List Student Assignments

`GET /students/:studentId/assignments`

**Access:** `SCHOOL_ADMIN`, `PARENT` (own child)

---

### 8.8 Remove Assignment

`DELETE /students/:studentId/assignments/:assignmentId`

**Access:** `SCHOOL_ADMIN`

Sets `status: INACTIVE`.

---

### 8.9 Parent: Get My Children

`GET /parents/me/children`

**Access:** `PARENT`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "665f1a2b3c4d5e6f7a8b9c45",
      "firstName": "Aarav",
      "lastName": "Sharma",
      "grade": "5",
      "activeAssignment": {
        "route": { "id": "...", "name": "Route A" },
        "bus": { "id": "...", "plateNumber": "MH-01-AB-1234" },
        "pickupStop": { "id": "...", "name": "Andheri Station", "latitude": 19.1197, "longitude": 72.8468 },
        "dropStop": { "id": "...", "name": "Bandra West", "latitude": 19.0596, "longitude": 72.8295 }
      },
      "activeTrip": {
        "id": "665f1a2b3c4d5e6f7a8b9c60",
        "status": "ACTIVE",
        "currentLat": 19.1150,
        "currentLng": 72.8400,
        "lastLocationAt": "2026-06-21T07:45:00.000Z"
      }
    }
  ]
}
```

---

## 9. Trips & GPS Tracking

### 9.1 Start Trip

`POST /trips/start`

**Access:** `DRIVER`

**Request**
```json
{
  "routeId": "665f1a2b3c4d5e6f7a8b9c30",
  "busId": "665f1a2b3c4d5e6f7a8b9c20"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c60",
    "status": "ACTIVE",
    "startedAt": "2026-06-21T07:30:00.000Z",
    "route": { "id": "...", "name": "Route A - North Zone" },
    "bus": { "id": "...", "plateNumber": "MH-01-AB-1234" }
  },
  "message": "Trip started successfully"
}
```

**Business rules:**
- Driver must be assigned to the bus
- Bus must be assigned to the route
- No other active trip for this bus or driver
- Triggers FCM `TRIP_STARTED` to parents on route

---

### 9.2 End Trip

`POST /trips/:tripId/end`

**Access:** `DRIVER` (own trip)

**Request** (optional)
```json
{
  "latitude": 19.0596,
  "longitude": 72.8295
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c60",
    "status": "COMPLETED",
    "startedAt": "2026-06-21T07:30:00.000Z",
    "endedAt": "2026-06-21T08:15:00.000Z"
  }
}
```

---

### 9.3 Get Active Trip (Driver)

`GET /trips/active`

**Access:** `DRIVER`

Returns driver's current active trip or `null`.

---

### 9.4 Get Trip Details

`GET /trips/:tripId`

**Access:** `SCHOOL_ADMIN`, `DRIVER` (own), `PARENT` (child on route)

---

### 9.5 List Trips

`GET /trips`

**Access:** `SCHOOL_ADMIN`

**Query params:** `page`, `limit`, `status`, `routeId`, `busId`, `driverId`, `date` (YYYY-MM-DD)

---

### 9.6 Update GPS Location (REST Fallback)

`POST /trips/:tripId/location`

**Access:** `DRIVER` (own active trip)

> **Primary transport:** Socket.IO `location:update`. REST is fallback when WebSocket unavailable.

**Request**
```json
{
  "latitude": 19.1150,
  "longitude": 72.8400,
  "heading": 180.5,
  "speed": 35.2,
  "accuracy": 10.0,
  "recordedAt": "2026-06-21T07:45:00.000Z"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "tripId": "665f1a2b3c4d5e6f7a8b9c60",
    "latitude": 19.1150,
    "longitude": 72.8400,
    "lastLocationAt": "2026-06-21T07:45:00.000Z"
  }
}
```

**Validation:**
- `accuracy` must be ≤ 50m (configurable) or update is ignored with `422`
- Trip must be `ACTIVE`

---

### 9.7 Get Trip Location History

`GET /trips/:tripId/locations`

**Access:** `SCHOOL_ADMIN`

**Query params:** `from`, `to` (ISO datetime), `limit`

---

## 10. ETA

### 10.1 Get ETA to Stop

`GET /trips/:tripId/eta`

**Access:** `PARENT`, `SCHOOL_ADMIN`, `DRIVER`

**Query params:**
| Param | Required | Description |
|-------|----------|-------------|
| `stopId` | No | Specific stop. Defaults to child's pickup/drop for parent |
| `studentId` | Parent only | Which child's stop to calculate |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "tripId": "665f1a2b3c4d5e6f7a8b9c60",
    "stop": {
      "id": "665f1a2b3c4d5e6f7a8b9c31",
      "name": "Andheri Station",
      "latitude": 19.1197,
      "longitude": 72.8468
    },
    "currentLocation": {
      "latitude": 19.1150,
      "longitude": 72.8400,
      "lastLocationAt": "2026-06-21T07:45:00.000Z"
    },
    "eta": {
      "durationSeconds": 480,
      "durationText": "8 mins",
      "distanceMeters": 3200,
      "distanceText": "3.2 km",
      "estimatedArrival": "2026-06-21T07:53:00.000Z"
    }
  }
}
```

**Implementation:** Google Maps Distance Matrix API, cached 30 seconds per trip+stop.

---

## 11. Emergency Alerts

### 11.1 Trigger Emergency

`POST /trips/:tripId/emergency`

**Access:** `DRIVER` (own active trip)

**Request**
```json
{
  "message": "Accident on highway",
  "latitude": 19.1150,
  "longitude": 72.8400
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c70",
    "tripId": "665f1a2b3c4d5e6f7a8b9c60",
    "status": "ACTIVE",
    "message": "Accident on highway",
    "latitude": 19.1150,
    "longitude": 72.8400,
    "createdAt": "2026-06-21T07:50:00.000Z"
  },
  "message": "Emergency alert sent"
}
```

**Side effects:**
- FCM push to all school admins + parents on route
- Socket.IO `emergency:alert` broadcast to `school:{schoolId}` and `trip:{tripId}`

---

### 11.2 List Emergency Alerts

`GET /emergencies`

**Access:** `SCHOOL_ADMIN`

**Query params:** `page`, `limit`, `status`, `tripId`, `date`

---

### 11.3 Acknowledge Emergency

`PATCH /emergencies/:alertId/acknowledge`

**Access:** `SCHOOL_ADMIN`

**Response `200`** — sets `status: ACKNOWLEDGED`, records `acknowledgedById` and `acknowledgedAt`.

---

### 11.4 Resolve Emergency

`PATCH /emergencies/:alertId/resolve`

**Access:** `SCHOOL_ADMIN`

**Response `200`** — sets `status: RESOLVED`, records `resolvedAt`.

---

## 12. Notifications

### 12.1 List My Notifications

`GET /notifications`

**Access:** All authenticated roles

**Query params:** `page`, `limit`, `type`, `status` (`SENT` | `READ`)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "665f1a2b3c4d5e6f7a8b9c80",
        "type": "PICKUP_APPROACHING",
        "title": "Bus Approaching",
        "body": "Bus MH-01-AB-1234 is 5 minutes from Andheri Station",
        "data": {
          "tripId": "665f1a2b3c4d5e6f7a8b9c60",
          "studentId": "665f1a2b3c4d5e6f7a8b9c45",
          "stopId": "665f1a2b3c4d5e6f7a8b9c31"
        },
        "status": "SENT",
        "createdAt": "2026-06-21T07:42:00.000Z",
        "readAt": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
  }
}
```

---

### 12.2 Mark Notification as Read

`PATCH /notifications/:notificationId/read`

**Access:** Notification owner

---

### 12.3 Mark All as Read

`PATCH /notifications/read-all`

**Access:** All authenticated roles

---

### 12.4 Admin: Send Broadcast Notification

`POST /notifications/broadcast`

**Access:** `SCHOOL_ADMIN`

**Request**
```json
{
  "title": "School Holiday Notice",
  "body": "No bus service tomorrow due to public holiday.",
  "target": "ALL_PARENTS",
  "data": {}
}
```

`target` values:
- `ALL_PARENTS`
- `ALL_DRIVERS`
- `ROUTE` (requires `routeId`)
- `CUSTOM` (requires `userIds[]`)

**Response `201`**
```json
{
  "success": true,
  "data": {
    "sentCount": 120,
    "failedCount": 2
  }
}
```

---

### 12.5 Admin: Notification Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications/templates` | List templates |
| `POST` | `/notifications/templates` | Create template |
| `PATCH` | `/notifications/templates/:id` | Update template |
| `DELETE` | `/notifications/templates/:id` | Delete template |

---

## 13. Live Monitoring (Admin)

### 13.1 Get Active Trips (Fleet View)

`GET /monitoring/active-trips`

**Access:** `SCHOOL_ADMIN`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "tripId": "665f1a2b3c4d5e6f7a8b9c60",
      "status": "ACTIVE",
      "startedAt": "2026-06-21T07:30:00.000Z",
      "bus": {
        "id": "665f1a2b3c4d5e6f7a8b9c20",
        "plateNumber": "MH-01-AB-1234"
      },
      "driver": {
        "id": "665f1a2b3c4d5e6f7a8b9c10",
        "firstName": "Raj",
        "lastName": "Kumar"
      },
      "route": {
        "id": "665f1a2b3c4d5e6f7a8b9c30",
        "name": "Route A - North Zone"
      },
      "location": {
        "latitude": 19.1150,
        "longitude": 72.8400,
        "heading": 180.5,
        "speed": 35.2,
        "lastLocationAt": "2026-06-21T07:45:00.000Z"
      },
      "studentCount": 12,
      "activeEmergencies": 0
    }
  ]
}
```

---

### 13.2 Get Dashboard Stats

`GET /monitoring/stats`

**Access:** `SCHOOL_ADMIN`

**Response `200`**
```json
{
  "success": true,
  "data": {
    "totalBuses": 10,
    "activeBuses": 7,
    "totalRoutes": 8,
    "totalStudents": 320,
    "totalDrivers": 12,
    "activeTrips": 7,
    "activeEmergencies": 0
  }
}
```

---

## 14. File Uploads

### 14.1 Get Presigned Upload URL

`POST /uploads/presign`

**Access:** Authenticated

**Request**
```json
{
  "fileName": "avatar.jpg",
  "fileType": "image/jpeg",
  "purpose": "AVATAR"
}
```

`purpose`: `AVATAR` | `SCHOOL_LOGO` | `DOCUMENT`

**Response `200`**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/...",
    "fileUrl": "https://cdn.example.com/avatars/...",
    "expiresIn": 300
  }
}
```

Client uploads directly to S3 via `uploadUrl`, then PATCHes resource with `fileUrl`.

---

## 15. Socket.IO Events

### 15.1 Connection

**URL:** `wss://api.{domain}`

**Auth (handshake):**
```json
{
  "auth": {
    "token": "<access_token>"
  }
}
```

**On connect:** Server auto-joins user to role-based rooms:
| Role | Auto-joined rooms |
|------|-------------------|
| `SCHOOL_ADMIN` | `school:{schoolId}` |
| `DRIVER` | `driver:{userId}` |
| `PARENT` | `parent:{userId}` |

**Client subscribe (after connect):**
```json
// Client → Server
{ "event": "subscribe:trip", "data": { "tripId": "665f1a2b3c4d5e6f7a8b9c60" } }

// Server → Client
{ "event": "subscribed", "data": { "room": "trip:665f1a2b3c4d5e6f7a8b9c60" } }
```

---

### 15.2 Event Reference

#### `location:update` (Driver → Server)

**Payload**
```json
{
  "tripId": "665f1a2b3c4d5e6f7a8b9c60",
  "latitude": 19.1150,
  "longitude": 72.8400,
  "heading": 180.5,
  "speed": 35.2,
  "accuracy": 10.0,
  "recordedAt": "2026-06-21T07:45:00.000Z"
}
```

**Server ack**
```json
{ "success": true }
```

---

#### `bus:location` (Server → Subscribers)

Broadcast to `trip:{tripId}` and `school:{schoolId}`.

```json
{
  "tripId": "665f1a2b3c4d5e6f7a8b9c60",
  "busId": "665f1a2b3c4d5e6f7a8b9c20",
  "routeId": "665f1a2b3c4d5e6f7a8b9c30",
  "latitude": 19.1150,
  "longitude": 72.8400,
  "heading": 180.5,
  "speed": 35.2,
  "recordedAt": "2026-06-21T07:45:00.000Z"
}
```

---

#### `trip:status` (Server → Subscribers)

Emitted on trip start, end, cancel.

```json
{
  "tripId": "665f1a2b3c4d5e6f7a8b9c60",
  "status": "ACTIVE",
  "routeId": "665f1a2b3c4d5e6f7a8b9c30",
  "busId": "665f1a2b3c4d5e6f7a8b9c20",
  "driverId": "665f1a2b3c4d5e6f7a8b9c10",
  "startedAt": "2026-06-21T07:30:00.000Z",
  "endedAt": null
}
```

---

#### `emergency:alert` (Server → Subscribers)

Broadcast to `school:{schoolId}` and `trip:{tripId}`.

```json
{
  "alertId": "665f1a2b3c4d5e6f7a8b9c70",
  "tripId": "665f1a2b3c4d5e6f7a8b9c60",
  "status": "ACTIVE",
  "message": "Accident on highway",
  "latitude": 19.1150,
  "longitude": 72.8400,
  "driver": {
    "firstName": "Raj",
    "lastName": "Kumar"
  },
  "bus": {
    "plateNumber": "MH-01-AB-1234"
  },
  "createdAt": "2026-06-21T07:50:00.000Z"
}
```

---

#### `notification:event` (Server → User)

Sent to `parent:{userId}` or `driver:{userId}`.

```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c80",
  "type": "PICKUP_APPROACHING",
  "title": "Bus Approaching",
  "body": "Bus is 5 minutes from your stop",
  "data": {
    "tripId": "665f1a2b3c4d5e6f7a8b9c60",
    "studentId": "665f1a2b3c4d5e6f7a8b9c45"
  },
  "createdAt": "2026-06-21T07:42:00.000Z"
}
```

---

#### `emergency:status` (Server → Subscribers)

On acknowledge / resolve.

```json
{
  "alertId": "665f1a2b3c4d5e6f7a8b9c70",
  "status": "ACKNOWLEDGED",
  "acknowledgedAt": "2026-06-21T07:52:00.000Z"
}
```

---

### 15.3 Geofence-Triggered Notifications (Server-Side)

Not client events. Server evaluates on each `location:update`:

| Trigger | Condition | Notification Type |
|---------|-----------|-------------------|
| Pickup approaching | Bus within 500m of pickup stop, not yet arrived | `PICKUP_APPROACHING` |
| Pickup completed | Bus within stop `radiusM` | `PICKUP_COMPLETED` |
| Drop approaching | Bus within 500m of drop stop | `DROP_APPROACHING` |
| Drop completed | Bus within stop `radiusM` | `DROP_COMPLETED` |

Idempotency enforced via `TripStopEvent` records.

---

## 16. Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `ACTIVE_TRIP_EXISTS` | 409 | Bus/driver already has active trip |
| `NO_ACTIVE_TRIP` | 422 | Operation requires active trip |
| `BUS_NOT_ASSIGNED` | 422 | Driver not assigned to bus |
| `ROUTE_MISMATCH` | 422 | Bus not assigned to route |
| `INACTIVE_RESOURCE` | 422 | Resource is inactive |
| `POOR_GPS_ACCURACY` | 422 | GPS accuracy below threshold |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Appendix A — Endpoint Summary

| Module | Endpoints |
|--------|-----------|
| Auth | 6 |
| Schools | 3 |
| Drivers | 5 |
| Parents | 4 + children |
| Buses | 5 |
| Routes | 9 |
| Students | 8 |
| Trips | 7 |
| ETA | 1 |
| Emergencies | 4 |
| Notifications | 5 + templates |
| Monitoring | 2 |
| Uploads | 1 |
| **Total REST** | **~60** |
| **Socket events** | **6** |

---

## Appendix B — Automatic Notification Triggers

| Event | Recipients | Channels |
|-------|------------|----------|
| Trip started | Parents on route | FCM + Socket |
| Trip ended | Parents on route | FCM + Socket |
| Pickup approaching | Specific parent | FCM + Socket |
| Pickup completed | Specific parent | FCM + Socket |
| Drop approaching | Specific parent | FCM + Socket |
| Drop completed | Specific parent | FCM + Socket |
| Emergency | Admins + parents on route | FCM + Socket |
| Admin broadcast | Target audience | FCM |
