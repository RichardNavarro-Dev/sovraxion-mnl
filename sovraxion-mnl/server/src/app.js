import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter, noSqlSanitize, requireClientHeader } from './middleware/security.js';
import { PRODUCT_IMAGE_DIR } from './middleware/upload.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { DISCOUNT_TIERS } from './utils/discounts.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://api.fontshare.com', 'https://cdn.fontshare.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://api.fontshare.com'],
          'script-src': ["'self'"],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'self'"],
          'object-src': ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (origin === 'null') return cb(null, env.ALLOW_NULL_ORIGIN);
        return cb(null, env.CLIENT_ORIGINS.includes(origin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Sovx-Client'],
      maxAge: 600,
    })
  );

  if (!env.isProduction) app.use(morgan('dev'));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(noSqlSanitize);

  app.use(
    '/uploads/products',
    express.static(PRODUCT_IMAGE_DIR, { fallthrough: false, maxAge: '7d', index: false, dotfiles: 'deny' })
  );

  app.use('/api', apiLimiter, requireClientHeader);

  app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));
  app.get('/api/config/store', (_req, res) =>
    res.json({
      success: true,
      merchant: env.MERCHANT,
      tiers: DISCOUNT_TIERS,
      currency: 'PHP',
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', notFound);

  const indexFile = path.join(env.CLIENT_DIST, 'index.html');
  if (fs.existsSync(indexFile)) {
    app.use(express.static(env.CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(indexFile));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
