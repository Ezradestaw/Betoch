import { FastifyInstance } from 'fastify';
import { register, login, refresh, logout, getMe } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.post('/refresh', refresh);
  fastify.post('/logout', logout);
  fastify.get('/me', { preHandler: [authenticate] }, getMe);
}
