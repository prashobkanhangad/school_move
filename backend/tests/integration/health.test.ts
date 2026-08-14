import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health endpoints', () => {
  const app = createApp();

  it('GET /health returns ok or degraded status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(['ok', 'degraded']).toContain(res.body.status);
    expect(res.body.timestamp).toBeDefined();
    expect(res.body).toHaveProperty('database');
  });

  it('GET /health/live returns alive', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('alive');
  });

  it('GET /api/v1/nonexistent returns 404 envelope', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login rejects invalid body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bad', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
