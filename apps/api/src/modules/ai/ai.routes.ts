// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — ROUTES
// Fastify route definitions for AI capabilities
// ==============================================================================

import { FastifyInstance } from 'fastify';
import {
  searchNaturalLanguage,
  getRecommendations,
  calculatePreferenceMatch,
  generateDescription,
  analyzeQuality,
  estimatePrice,
  analyzePhotos,
  compareProperties,
  chatWithAssistant,
  createViewingRequest,
  getPropertyViewings,
  submitFeedback,
  evaluateRisk,
  getAdminAIMetrics,
  getAdminFeatureFlags,
  toggleFeatureFlag
} from './ai.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@betoch/shared';

export async function aiRoutes(fastify: FastifyInstance) {
  // Public / Semi-Public AI discovery endpoints
  fastify.post('/search', searchNaturalLanguage);
  fastify.get('/recommendations', getRecommendations);
  fastify.post('/match', calculatePreferenceMatch);
  fastify.post('/quality/analyze', analyzeQuality);
  fastify.post('/pricing/estimate', estimatePrice);
  fastify.post('/photos/analyze', analyzePhotos);
  fastify.post('/properties/compare', compareProperties);
  fastify.post('/assistant/chat', chatWithAssistant);
  fastify.post('/feedback', submitFeedback);

  // Authenticated Owner / Renter endpoints
  fastify.post('/description/generate', { preHandler: [authenticate] }, generateDescription);
  fastify.post('/viewings', { preHandler: [authenticate] }, createViewingRequest);
  fastify.get('/viewings/property/:propertyId', { preHandler: [authenticate] }, getPropertyViewings);

  // Admin AI Operations & Moderation
  fastify.get('/risk/:type/:id', { preHandler: [authenticate, requireRole(UserRole.ADMIN)] }, evaluateRisk);
  fastify.get('/admin/metrics', { preHandler: [authenticate, requireRole(UserRole.ADMIN)] }, getAdminAIMetrics);
  fastify.get('/admin/feature-flags', { preHandler: [authenticate, requireRole(UserRole.ADMIN)] }, getAdminFeatureFlags);
  fastify.post('/admin/feature-flags/toggle', { preHandler: [authenticate, requireRole(UserRole.ADMIN)] }, toggleFeatureFlag);
}
