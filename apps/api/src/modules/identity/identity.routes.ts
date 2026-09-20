// ==============================================================================
// BETOCH IDENTITY VERIFICATION ROUTES
// Fastify route definitions for national ID verification lifecycle
// ==============================================================================

import { FastifyInstance } from 'fastify';
import {
  startVerification,
  getVerificationStatus,
  handleVerificationCallback,
  retryVerification,
  revokeVerification,
  simulateMockVerification
} from './identity.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@betoch/shared';

export async function identityRoutes(fastify: FastifyInstance) {
  // Client lifecycle endpoints
  fastify.post('/start', { preHandler: [authenticate] }, startVerification);
  fastify.get('/status', { preHandler: [authenticate] }, getVerificationStatus);
  fastify.post('/retry', { preHandler: [authenticate] }, retryVerification);

  // Inbound provider callback / webhook
  fastify.post('/callback', handleVerificationCallback);
  fastify.get('/callback', handleVerificationCallback);

  // Admin revocation endpoint
  fastify.post(
    '/revoke/:userId',
    { preHandler: [authenticate, requireRole(UserRole.ADMIN)] },
    revokeVerification
  );

  // Development mock simulation
  fastify.post(
    '/mock/simulate',
    { preHandler: [authenticate] },
    simulateMockVerification
  );
}
