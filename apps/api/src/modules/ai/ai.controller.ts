// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — CONTROLLER
// Handles requests, input validation, feature flag checks, and responses
// ==============================================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { AIService } from './ai.service.js';
import {
  naturalLanguageSearchSchema,
  generateDescriptionSchema,
  analyzeQualitySchema,
  estimatePriceSchema,
  comparePropertiesSchema,
  aiPreferenceMatchSchema,
  assistantChatSchema,
  createViewingRequestSchema,
  aiFeedbackSchema,
  toggleFeatureFlagSchema
} from '@betoch/validation';
import { AIFeatureKey, UserRole } from '@betoch/shared';

export async function searchNaturalLanguage(request: FastifyRequest, reply: FastifyReply) {
  const isEnabled = await AIService.featureFlags.isFeatureEnabled(AIFeatureKey.AI_PROPERTY_SEARCH);
  if (!isEnabled) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'AI Property Search is currently paused by administrators.' }
    });
  }

  const parseResult = naturalLanguageSearchSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const userId = request.user?.id;
  const result = await AIService.search.searchWithNaturalLanguage(parseResult.data.query, userId);
  return reply.send({ success: true, data: result });
}

export async function getRecommendations(request: FastifyRequest, reply: FastifyReply) {
  const isEnabled = await AIService.featureFlags.isFeatureEnabled(AIFeatureKey.AI_RECOMMENDATIONS);
  if (!isEnabled) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'AI Recommendations are currently paused.' }
    });
  }

  const userId = request.user?.id;
  const recommendations = await AIService.recommendations.getRecommendationsForUser(userId);
  return reply.send({ success: true, data: recommendations });
}

export async function calculatePreferenceMatch(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = aiPreferenceMatchSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { propertyId, preferences } = parseResult.data;
  const result = await AIService.matching.calculateMatch(propertyId, preferences);
  return reply.send({ success: true, data: result });
}

export async function generateDescription(request: FastifyRequest, reply: FastifyReply) {
  const isEnabled = await AIService.featureFlags.isFeatureEnabled(AIFeatureKey.AI_DESCRIPTION_GENERATOR);
  if (!isEnabled) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'AI Description Generator is currently paused.' }
    });
  }

  const parseResult = generateDescriptionSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const userId = request.user?.id;
  const result = await AIService.description.generateDescription(parseResult.data, userId);
  return reply.send({ success: true, data: result });
}

export async function analyzeQuality(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = analyzeQualitySchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const result = AIService.quality.analyzeQuality(parseResult.data);
  return reply.send({ success: true, data: result });
}

export async function estimatePrice(request: FastifyRequest, reply: FastifyReply) {
  const isEnabled = await AIService.featureFlags.isFeatureEnabled(AIFeatureKey.AI_PRICE_ASSISTANT);
  if (!isEnabled) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'AI Price Assistant is currently paused.' }
    });
  }

  const parseResult = estimatePriceSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const result = await AIService.pricing.estimateMarketPrice(parseResult.data);
  return reply.send({ success: true, data: result });
}

export async function analyzePhotos(request: FastifyRequest, reply: FastifyReply) {
  const isEnabled = await AIService.featureFlags.isFeatureEnabled(AIFeatureKey.AI_PHOTO_ANALYSIS);
  if (!isEnabled) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'AI Photo Analysis is currently paused.' }
    });
  }

  const body = request.body as { imageUrls?: string[] };
  if (!body || !Array.isArray(body.imageUrls) || body.imageUrls.length === 0) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Please provide at least 1 image URL in imageUrls array.' }
    });
  }

  const results = await AIService.images.analyzePhotos(body.imageUrls);
  return reply.send({ success: true, data: results });
}

export async function compareProperties(request: FastifyRequest, reply: FastifyReply) {
  const isEnabled = await AIService.featureFlags.isFeatureEnabled(AIFeatureKey.AI_PROPERTY_COMPARISON);
  if (!isEnabled) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'AI Property Comparison is currently paused.' }
    });
  }

  const parseResult = comparePropertiesSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const result = await AIService.comparison.compareProperties(parseResult.data.propertyIds);
  return reply.send({ success: true, data: result });
}

export async function chatWithAssistant(request: FastifyRequest, reply: FastifyReply) {
  const isEnabled = await AIService.featureFlags.isFeatureEnabled(AIFeatureKey.AI_SUPPORT_ASSISTANT);
  if (!isEnabled) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'Betoch AI Assistant is currently paused.' }
    });
  }

  const parseResult = assistantChatSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const userId = request.user?.id;
  const result = await AIService.assistant.handleMessage(
    parseResult.data.message,
    userId,
    parseResult.data.conversationHistory
  );
  return reply.send({ success: true, data: result });
}

export async function createViewingRequest(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required to schedule a viewing.' }
    });
  }

  const parseResult = createViewingRequestSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { propertyId, proposedDate, timeSlot, notes } = parseResult.data;
  const result = await AIService.assistant.createViewingRequest(
    request.user.id,
    propertyId,
    proposedDate,
    timeSlot,
    notes
  );

  return reply.status(201).send({ success: true, data: result });
}

export async function getPropertyViewings(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { propertyId: string };
  const requests = await AIService.assistant.getPropertyViewingRequests(params.propertyId);
  return reply.send({ success: true, data: requests });
}

export async function submitFeedback(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = aiFeedbackSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const userId = request.user?.id;
  await AIService.observability.recordFeedback({
    ...parseResult.data,
    userId
  });

  return reply.send({ success: true, message: 'Thank you for your feedback!' });
}

export async function evaluateRisk(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { type: string; id: string };
  if (params.type === 'user') {
    const report = await AIService.fraud.evaluateUserRisk(params.id);
    return reply.send({ success: true, data: report });
  } else if (params.type === 'property') {
    const report = await AIService.fraud.evaluatePropertyRisk(params.id);
    return reply.send({ success: true, data: report });
  }
  return reply.status(400).send({ success: false, error: { message: 'Invalid entity type' } });
}

export async function getAdminAIMetrics(request: FastifyRequest, reply: FastifyReply) {
  const metrics = await AIService.observability.getMetrics();
  return reply.send({ success: true, data: metrics });
}

export async function getAdminFeatureFlags(request: FastifyRequest, reply: FastifyReply) {
  const flags = await AIService.featureFlags.getAllFlags();
  return reply.send({ success: true, data: flags });
}

export async function toggleFeatureFlag(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = toggleFeatureFlagSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  await AIService.featureFlags.toggleFeature(parseResult.data.featureKey, parseResult.data.isEnabled);
  return reply.send({ success: true, message: `Feature flag ${parseResult.data.featureKey} updated successfully.` });
}
