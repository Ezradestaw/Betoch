import { FastifyInstance } from 'fastify';
import {
  searchProperties,
  getPropertyDetails,
  createProperty,
  getMyListings,
  updatePropertyPrice,
  getOwnerPublicProfile
} from './properties.controller.js';
import { authenticate, requireRole, requireVerifiedIdentity } from '../../middleware/auth.js';
import { UserRole } from '@betoch/shared';

export async function propertiesRoutes(fastify: FastifyInstance) {
  fastify.get('/', searchProperties);
  fastify.get('/my-listings', { preHandler: [authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN)] }, getMyListings);
  fastify.get('/owner/:ownerId/profile', getOwnerPublicProfile);
  fastify.get('/:idOrSlug', getPropertyDetails);
  fastify.post('/', { preHandler: [authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), requireVerifiedIdentity] }, createProperty);
  fastify.patch('/:id/price', { preHandler: [authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN)] }, updatePropertyPrice);
}


