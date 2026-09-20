import { FastifyInstance } from 'fastify';
import { completeRental, getContractDetails } from './contracts.controller.js';
import { authenticate } from '../../middleware/auth.js';

export async function contractsRoutes(fastify: FastifyInstance) {
  fastify.post('/complete-rental', { preHandler: [authenticate] }, completeRental);
  fastify.get('/:id', { preHandler: [authenticate] }, getContractDetails);
}
