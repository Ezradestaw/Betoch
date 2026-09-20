import { FastifyInstance } from 'fastify';
import {
  searchProperties,
  getPropertyDetails,
  createProperty,
  getMyListings
} from './properties.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@betoch/shared';

export async function propertiesRoutes(fastify: FastifyInstance) {
  fastify.get('/', searchProperties);
  fastify.get('/my-listings', { preHandler: [authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN)] }, getMyListings);
  fastify.get('/:idOrSlug', getPropertyDetails);
  fastify.post('/', { preHandler: [authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN)] }, createProperty);
}
