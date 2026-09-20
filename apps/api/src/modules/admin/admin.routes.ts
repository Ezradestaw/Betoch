import { FastifyInstance } from 'fastify';
import {
  getAnalytics,
  getPendingVerifications,
  getPendingProperties,
  reviewPropertyVerification,
  getCommissions,
  getReports,
  getAuditLogs
} from './admin.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@betoch/shared';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireRole(UserRole.ADMIN));

  fastify.get('/analytics', getAnalytics);
  fastify.get('/verifications/pending', getPendingVerifications);
  fastify.get('/properties/pending', getPendingProperties);
  fastify.post('/properties/:id/review', reviewPropertyVerification);
  fastify.get('/commissions', getCommissions);
  fastify.get('/reports', getReports);
  fastify.get('/audit-logs', getAuditLogs);
}
