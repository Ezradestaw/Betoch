// ==============================================================================
// BETOCH NOTIFICATIONS MODULE — ROUTES & CONTROLLERS
// ==============================================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../../database/db.js';
import { authenticate } from '../../middleware/auth.js';

export async function getNotifications(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { limit = '30', unreadOnly = 'false' } = request.query as { limit?: string; unreadOnly?: string };

  const parsedLimit = Math.min(parseInt(limit, 10) || 30, 100);
  const whereUnread = unreadOnly === 'true' ? 'AND is_read = false' : '';

  const res = await query(
    `SELECT id, user_id, title, message, type, link_url, is_read, created_at
     FROM notifications
     WHERE user_id = $1 ${whereUnread}
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, parsedLimit]
  );

  const countRes = await query(
    `SELECT COUNT(*)::int AS unread_count
     FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return reply.send({
    success: true,
    data: {
      notifications: res.rows.map((r) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        linkUrl: r.link_url,
        isRead: r.is_read,
        createdAt: r.created_at
      })),
      unreadCount: countRes.rows[0]?.unread_count || 0
    }
  });
}

export async function markAsRead(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return reply.send({ success: true, message: 'Notification marked as read.' });
}

export async function markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  await query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return reply.send({ success: true, message: 'All notifications marked as read.' });
}

export async function deleteNotification(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return reply.send({ success: true, message: 'Notification deleted.' });
}

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', getNotifications);
  fastify.patch('/:id/read', markAsRead);
  fastify.post('/mark-all-read', markAllAsRead);
  fastify.delete('/:id', deleteNotification);
}
