import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../../infrastructure/database/health';

const router = Router();

router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  const connected = await checkDatabaseConnection();
  if (connected) {
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(503).json({
    status: 'not_ready',
    database: 'disconnected',
    timestamp: new Date().toISOString(),
    error: 'Database unavailable',
  });
});

router.get('/', async (_req: Request, res: Response) => {
  const database = (await checkDatabaseConnection()) ? 'connected' : 'disconnected';

  res.json({
    status: database === 'connected' ? 'ok' : 'degraded',
    database,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
  });
});

export default router;
