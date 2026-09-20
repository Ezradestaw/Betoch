import { FastifyInstance } from 'fastify';
import {
  submitApplication,
  getMyApplications,
  getPropertyApplications,
  updateApplicationStatus
} from './applications.controller.js';
import { authenticate, requireVerifiedIdentity } from '../../middleware/auth.js';

export async function applicationsRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate, requireVerifiedIdentity] }, submitApplication);
  fastify.get('/my-applications', { preHandler: [authenticate] }, getMyApplications);
  fastify.get('/property/:propertyId', { preHandler: [authenticate] }, getPropertyApplications);
  fastify.patch('/:id/status', { preHandler: [authenticate] }, updateApplicationStatus);
}
