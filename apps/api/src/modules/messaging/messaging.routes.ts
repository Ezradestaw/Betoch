import { FastifyInstance } from 'fastify';
import {
  getMyConversations,
  startConversation,
  getConversationMessages,
  sendMessage
} from './messaging.controller.js';
import { authenticate } from '../../middleware/auth.js';

export async function messagingRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate] }, getMyConversations);
  fastify.post('/', { preHandler: [authenticate] }, startConversation);
  fastify.get('/:id/messages', { preHandler: [authenticate] }, getConversationMessages);
  fastify.post('/:id/messages', { preHandler: [authenticate] }, sendMessage);
}
