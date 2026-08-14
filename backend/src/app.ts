import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './presentation/routes';
import healthRoutes from './presentation/routes/health.routes';
import { errorHandler, notFoundHandler } from './presentation/middlewares/error.middleware';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests' },
    },
  });

  app.use('/health', healthRoutes);

  app.use('/api/v1', authLimiter, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
