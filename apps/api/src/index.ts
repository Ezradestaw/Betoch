import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';

import { config } from '@betoch/config';
import { pool } from './database/db.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { propertiesRoutes } from './modules/properties/properties.routes.js';
import { favoritesRoutes } from './modules/properties/favorites.routes.js';
import { verificationRoutes } from './modules/verification/verification.routes.js';
import { applicationsRoutes } from './modules/applications/applications.routes.js';
import { contractsRoutes } from './modules/contracts/contracts.routes.js';
import { paymentsRoutes } from './modules/payments/payments.routes.js';
import { messagingRoutes } from './modules/messaging/messaging.routes.js';
import { reviewsRoutes } from './modules/reviews/reviews.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { uploadsRoutes } from './modules/uploads/uploads.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { savedSearchesRoutes } from './modules/saved-searches/saved-searches.routes.js';
import { viewingsRoutes } from './modules/viewings/viewings.routes.js';
import { identityRoutes } from './modules/identity/identity.routes.js';

const app = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport:
      config.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' }
          }
        : undefined
  },
  disableRequestLogging: false
});

async function bootstrap() {
  // Security Headers & CORS
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  });

  await app.register(cors, {
    origin: [config.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Cookies & JWT
  await app.register(cookie, {
    secret: config.COOKIE_SECRET
  });

  await app.register(jwt, {
    secret: config.JWT_SECRET
  });

  // File Uploads
  await app.register(multipart, {
    limits: {
      fileSize: config.MAX_FILE_SIZE_MB * 1024 * 1024
    }
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // Static Assets for uploaded photos
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/'
  });

  // OpenAPI / Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Betoch Marketplace API',
        description: 'High-performance real-estate rental marketplace API for Ethiopia',
        version: '1.0.0'
      },
      servers: [{ url: `http://localhost:${config.PORT}` }]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation'
  });

  // Health & Readiness Endpoints
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/ready', async (_req, reply) => {
    try {
      await pool.query('SELECT 1');
      return { status: 'ready', database: 'connected' };
    } catch (err) {
      reply.status(503);
      return { status: 'unhealthy', database: 'disconnected' };
    }
  });

  // Domain API Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(propertiesRoutes, { prefix: '/api/v1/properties' });
  await app.register(favoritesRoutes, { prefix: '/api/v1/favorites' });
  await app.register(verificationRoutes, { prefix: '/api/v1/verification' });
  await app.register(applicationsRoutes, { prefix: '/api/v1/applications' });
  await app.register(contractsRoutes, { prefix: '/api/v1/contracts' });
  await app.register(paymentsRoutes, { prefix: '/api/v1/payments' });
  await app.register(messagingRoutes, { prefix: '/api/v1/conversations' });
  await app.register(reviewsRoutes, { prefix: '/api/v1/reviews' });
  await app.register(reportsRoutes, { prefix: '/api/v1/reports' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.register(uploadsRoutes, { prefix: '/api/v1/uploads' });
  await app.register(aiRoutes, { prefix: '/api/v1/ai' });
  await app.register(notificationsRoutes, { prefix: '/api/v1/notifications' });
  await app.register(savedSearchesRoutes, { prefix: '/api/v1/saved-searches' });
  await app.register(viewingsRoutes, { prefix: '/api/v1/viewings' });
  await app.register(identityRoutes, { prefix: '/api/v1/identity-verification' });


  // Centralized Error Handling
  app.setErrorHandler((error: any, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode || 500;
    const isClientError = statusCode < 500;

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || (isClientError ? 'CLIENT_ERROR' : 'INTERNAL_SERVER_ERROR'),
        message: isClientError ? error.message : 'An unexpected error occurred. Please try again.',
        requestId: request.id
      }
    });
  });

  // Start Server
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(`🚀 Betoch API server running on http://${config.HOST}:${config.PORT}`);
    app.log.info(`📚 Swagger Documentation available at http://${config.HOST}:${config.PORT}/documentation`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
