import { FastifyInstance } from 'fastify';
import {
  submitIdentityVerification,
  getIdentityVerificationStatus,
  reviewIdentityVerification
} from './verification.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@betoch/shared';

export async function verificationRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, submitIdentityVerification);
  fastify.get('/status', { preHandler: [authenticate] }, getIdentityVerificationStatus);
  fastify.post('/:id/review', { preHandler: [authenticate, requireRole(UserRole.ADMIN)] }, reviewIdentityVerification);
}
