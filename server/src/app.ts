import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler, ok } from './lib/http.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { moviesRouter } from './modules/movies/movies.routes.js';
import { theatresRouter } from './modules/theatres/theatres.routes.js';
import { screensRouter, theatreScreensRouter } from './modules/screens/screens.routes.js';
import { showsRouter } from './modules/shows/shows.routes.js';
import { bookingsRouter } from './modules/bookings/bookings.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { promoRouter } from './modules/promo/promo.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { uploadsDir, uploadsRouter } from './modules/uploads/uploads.routes.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));

  app.get('/api/health', (_req, res) => ok(res, { status: 'ok', service: 'CineBook API' }));

  app.use('/api/auth', authRouter);
  app.use('/api/movies', moviesRouter);
  app.use('/api/theatres/:theatreId/screens', theatreScreensRouter);
  app.use('/api/theatres', theatresRouter);
  app.use('/api/screens', screensRouter);
  app.use('/api/shows', showsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/promo', promoRouter);
  app.use('/api/admin/uploads', uploadsRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
