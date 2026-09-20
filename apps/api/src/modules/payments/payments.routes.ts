import { FastifyInstance } from 'fastify';
import {
  initiatePayment,
  handleTelebirrWebhook,
  simulateMockPaymentApproval,
  getPaymentStatus
} from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.post('/telebirr/initiate', { preHandler: [authenticate] }, initiatePayment);
  fastify.post('/telebirr/webhook', handleTelebirrWebhook);
  fastify.post('/mock-simulate/:outTradeNo', simulateMockPaymentApproval);
  fastify.get('/:outTradeNo/status', getPaymentStatus);
}
