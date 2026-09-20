import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { submitReportSchema } from '@betoch/validation';
import { query } from '../../database/db.js';
import { authenticate } from '../../middleware/auth.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function submitReport(request: FastifyRequest, reply: FastifyReply) {
  const reporterId = request.user!.id;

  const parseResult = submitReportSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { reportedUserId, propertyId, reason, description } = parseResult.data;

  const res = await query(
    `INSERT INTO reports (reporter_id, reported_user_id, property_id, reason, description, status)
     VALUES ($1, $2, $3, $4, $5, 'OPEN')
     RETURNING id, status, created_at`,
    [reporterId, reportedUserId || null, propertyId || null, reason, description]
  );

  await logAuditEvent({
    actorId: reporterId,
    action: 'REPORT_SUBMITTED',
    resourceType: 'reports',
    resourceId: res.rows[0].id,
    metadata: { reason, propertyId, reportedUserId }
  });

  return reply.status(201).send({
    success: true,
    message: 'Report submitted. Our moderation team will investigate thoroughly.',
    data: res.rows[0]
  });
}

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, submitReport);
}
