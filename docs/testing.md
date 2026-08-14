# Testing Strategy

## Overview

| Layer | Framework | Scope |
|-------|-----------|-------|
| Backend unit | Vitest | Utils, validators, pure logic |
| Backend integration | Vitest + Supertest | HTTP API, auth flow |
| Admin web | Vitest | API client utilities |
| Driver app | Flutter test | Models, smoke tests |
| Parent app | Flutter test | Models, smoke tests |
| CI | GitHub Actions | All suites on push/PR |

---

## Backend

### Run tests

```bash
cd backend

# Unit tests only (no database required)
npm run test:unit

# Integration tests (requires MongoDB)
npm run test:integration

# All unit tests (integration skipped by default)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Integration tests

Set `RUN_INTEGRATION_TESTS=true` and run:

```bash
cd backend
npm run test:integration
```

If MongoDB is not installed locally, tests automatically start an **in-memory MongoDB** (via `mongodb-memory-server`). CI uses a real MongoDB service container.

Optional: point at a remote test database:

```bash
INTEGRATION_DATABASE_URL="mongodb+srv://.../school_bus_test" RUN_INTEGRATION_TESTS=true npm run test:integration
```

### Test structure

```
backend/tests/
├── setup.ts
├── unit/
│   ├── crypto.test.ts
│   ├── pagination.test.ts
│   └── schemas.test.ts
└── integration/
    ├── health.test.ts
    └── auth.test.ts
```

---

## Admin Web

```bash
cd admin-web
npm test
```

---

## Flutter Apps

```bash
cd driver_app && flutter test
cd parent_app && flutter test
```

---

## Manual E2E Checklist (MVP)

### Admin
- Login, create driver/parent/bus/route/student, assign route, live monitoring

### Driver
- Login, start trip, GPS updates, emergency, end trip

### Parent
- Login, LIVE badge, tracking map, ETA, notifications

---

## CI Pipeline

See `.github/workflows/ci.yml`
