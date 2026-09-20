// ==============================================================================
// BETOCH IDENTITY VERIFICATION CONTROLLER
// REST API handlers for national ID verification lifecycle
// ==============================================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import {
  startIdentityVerificationSchema,
  callbackIdentityVerificationSchema,
  revokeIdentityVerificationSchema
} from '@betoch/validation';
import { identityVerificationService } from './identity.service.js';

export async function startVerification(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const parseResult = startIdentityVerificationSchema.safeParse(request.body || {});
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const session = await identityVerificationService.startVerification(
    userId,
    parseResult.data,
    { ip: request.ip, userAgent: request.headers['user-agent'] }
  );

  return reply.status(201).send({
    success: true,
    data: session
  });
}

export async function getVerificationStatus(request: FastifyRequest, reply: FastifyReply) {
  // Always uses the authenticated user's ID to prevent IDOR / BOLA attacks
  const userId = request.user!.id;

  const status = await identityVerificationService.getVerificationStatus(userId);

  return reply.send({
    success: true,
    data: status
  });
}

export async function handleVerificationCallback(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = callbackIdentityVerificationSchema.safeParse(request.body || request.query || {});
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const result = await identityVerificationService.handleCallback(
    parseResult.data,
    { ip: request.ip, userAgent: request.headers['user-agent'] }
  );

  return reply.send({
    success: result.success,
    data: result
  });
}

export async function retryVerification(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const session = await identityVerificationService.retryVerification(
    userId,
    { ip: request.ip, userAgent: request.headers['user-agent'] }
  );

  return reply.send({
    success: true,
    data: session
  });
}

export async function revokeVerification(request: FastifyRequest, reply: FastifyReply) {
  const adminId = request.user!.id;
  const { userId } = request.params as { userId: string };

  const parseResult = revokeIdentityVerificationSchema.safeParse({
    targetUserId: userId,
    reason: (request.body as any)?.reason
  });

  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const result = await identityVerificationService.revokeVerification(
    adminId,
    parseResult.data.targetUserId,
    parseResult.data.reason,
    { ip: request.ip, userAgent: request.headers['user-agent'] }
  );

  return reply.send({
    success: true,
    message: result.message
  });
}

// Development simulation endpoint for test suites and localhost testing
export async function simulateMockVerification(request: FastifyRequest, reply: FastifyReply) {
  if (process.env.NODE_ENV === 'production') {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Simulation endpoints are disabled in production.' }
    });
  }

  const body = request.body as {
    state: string;
    outcome?: 'APPROVED' | 'REJECTED';
    failureReason?: string;
  };

  if (!body?.state) {
    return reply.status(400).send({
      success: false,
      error: { code: 'MISSING_STATE', message: 'State parameter is required.' }
    });
  }

  const result = await identityVerificationService.handleCallback(
    {
      state: body.state,
      simulatedOutcome: body.outcome || 'APPROVED',
      failureReason: body.failureReason
    },
    { ip: request.ip, userAgent: request.headers['user-agent'] }
  );

  return reply.send({
    success: result.success,
    data: result
  });
}
