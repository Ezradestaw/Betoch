// ==============================================================================
// BETOCH SAVED SEARCHES MODULE — ROUTES & CONTROLLERS
// ==============================================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../../database/db.js';
import { authenticate } from '../../middleware/auth.js';
import { createSavedSearchSchema } from '@betoch/validation';

export async function getSavedSearches(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const res = await query(
    `SELECT id, user_id, name, filters, notify_email, notify_in_app, last_alerted_at, created_at
     FROM saved_searches
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      filters: r.filters,
      notifyEmail: r.notify_email,
      notifyInApp: r.notify_in_app,
      lastAlertedAt: r.last_alerted_at,
      createdAt: r.created_at
    }))
  });
}

export async function createSavedSearch(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const parseResult = createSavedSearchSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { name, filters, notifyEmail, notifyInApp } = parseResult.data;

  const res = await query(
    `INSERT INTO saved_searches (user_id, name, filters, notify_email, notify_in_app)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, filters, notify_email, notify_in_app, created_at`,
    [userId, name, JSON.stringify(filters), notifyEmail, notifyInApp]
  );

  return reply.status(201).send({
    success: true,
    message: 'Search preferences saved successfully.',
    data: res.rows[0]
  });
}

export async function deleteSavedSearch(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await query(
    `DELETE FROM saved_searches WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return reply.send({ success: true, message: 'Saved search deleted.' });
}

export async function savedSearchesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', getSavedSearches);
  fastify.post('/', createSavedSearch);
  fastify.delete('/:id', deleteSavedSearch);
}
