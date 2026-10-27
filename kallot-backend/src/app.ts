import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins, env } from './config/env';
import { prisma } from './db/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';
import { asyncHandler } from './utils/asyncHandler';
import { buildOpenApi } from './docs/openapi';
import { authRoutes } from './modules/auth/auth.routes';
import { classRoutes } from './modules/classes/classes.routes';
import { specializationRoutes } from './modules/specializations/specializations.routes';
import { yeshivaRoutes } from './modules/yeshivot/yeshivot.routes';
import { kallotRoutes } from './modules/kallot/kallot.routes';
import { statsRoutes } from './modules/stats/stats.routes';
import { requestRoutes } from './modules/requests/requests.routes';
import { reminderRoutes } from './modules/reminders/reminders.routes';
import { albumRoutes } from './modules/albums/albums.routes';
import { contentRoutes } from './modules/content/content.routes';
import { adminRoutes } from './modules/admin/admin.routes';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // Swagger UI צריך סקריפטים משלו, ולכן CSP מוגדר בהתאם
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => {
        // בקשות בלי origin (Swagger מאותו שרת, curl) מותרות
        if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '200kb' }));

  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
    }),
  );

  const openapi = buildOpenApi();
  app.get('/api-docs.json', (_req, res) => {
    res.json(openapi);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'שנתון הכלות API' }));

  app.use('/api', rateLimit(env.NODE_ENV === 'test' ? 100_000 : 300));
  app.use('/api/auth', authRoutes);
  app.use('/api/classes', classRoutes);
  app.use('/api/specializations', specializationRoutes);
  app.use('/api/yeshivot', yeshivaRoutes);
  app.use('/api', kallotRoutes);
  app.use('/api', statsRoutes);
  app.use('/api', requestRoutes);
  app.use('/api', reminderRoutes);
  app.use('/api', albumRoutes);
  app.use('/api', contentRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
