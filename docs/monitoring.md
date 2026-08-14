# Monitoring & Observability

## Health Endpoints

| Endpoint | Purpose | Use for |
|----------|---------|---------|
| `GET /health` | Full status + DB check | Dashboards, uptime monitors |
| `GET /health/live` | Liveness probe | Kubernetes / load balancer |
| `GET /health/ready` | Readiness probe | Traffic routing (503 if DB down) |

### `GET /health` response

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-06-21T10:00:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0",
  "environment": "production"
}
```

Status is `degraded` when database is unreachable.

---

## AWS EC2 Deployment

### Load balancer health checks

| Check | Path | Healthy |
|-------|------|---------|
| Liveness | `/health/live` | HTTP 200 |
| Readiness | `/health/ready` | HTTP 200 |

### PM2

```bash
pm2 start dist/server.js --name school-bus-api
pm2 logs school-bus-api
```

---

## Recommended Alerts

| Alert | Condition |
|-------|-----------|
| API down | `/health/live` fails 3x |
| DB disconnected | `/health/ready` returns 503 |
| Active emergencies | `activeEmergencies > 0` |

---

## Metrics

| Metric | Source |
|--------|--------|
| Active trips | `GET /monitoring/stats` |
| Notification delivery | `Notification.status` |
| GPS updates | `LocationLog` collection |
