import { FastifyRequest, FastifyReply } from 'fastify';
import { sendMessageSchema, startConversationSchema } from '@betoch/validation';
import { query, withTransaction } from '../../database/db.js';

export async function getMyConversations(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const res = await query(
    `SELECT 
      c.id AS conversation_id, c.property_id, c.updated_at,
      p.title AS property_title,
      up_other.first_name AS other_first_name,
      up_other.last_name AS other_last_name,
      up_other.avatar_url AS other_avatar_url,
      u_other.id AS other_user_id,
      (
        SELECT m.content FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message,
      (
        SELECT m.created_at FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message_at
     FROM conversation_participants cp
     JOIN conversations c ON c.id = cp.conversation_id
     LEFT JOIN properties p ON p.id = c.property_id
     JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != $1
     JOIN users u_other ON u_other.id = cp_other.user_id
     JOIN user_profiles up_other ON up_other.user_id = cp_other.user_id
     WHERE cp.user_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      conversationId: row.conversation_id,
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      otherParticipant: {
        id: row.other_user_id,
        name: `${row.other_first_name} ${row.other_last_name}`,
        avatarUrl: row.other_avatar_url
      },
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      updatedAt: row.updated_at
    }))
  });
}

export async function startConversation(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const parseResult = startConversationSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { recipientId, propertyId, initialMessage } = parseResult.data;

  if (recipientId === userId) {
    return reply.status(400).send({
      success: false,
      error: { code: 'INVALID_RECIPIENT', message: 'You cannot message yourself.' }
    });
  }

  // Check if conversation already exists between these 2 users (and optional property)
  const existingRes = await query(
    `SELECT cp1.conversation_id FROM conversation_participants cp1
     JOIN conversation_participants cp2 ON cp2.conversation_id = cp1.conversation_id
     JOIN conversations c ON c.id = cp1.conversation_id
     WHERE cp1.user_id = $1 AND cp2.user_id = $2
     ${propertyId ? 'AND c.property_id = $3' : ''}
     LIMIT 1`,
    propertyId ? [userId, recipientId, propertyId] : [userId, recipientId]
  );

  if (existingRes.rows.length > 0) {
    const convId = existingRes.rows[0].conversation_id;
    // Send message to existing conversation
    await query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`,
      [convId, userId, initialMessage]
    );
    await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [convId]);

    return reply.send({
      success: true,
      data: { conversationId: convId }
    });
  }

  const newConv = await withTransaction(async (client) => {
    const convRes = await client.query(
      `INSERT INTO conversations (property_id) VALUES ($1) RETURNING id`,
      [propertyId || null]
    );
    const convId = convRes.rows[0].id;

    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id)
       VALUES ($1, $2), ($1, $3)`,
      [convId, userId, recipientId]
    );

    await client.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)`,
      [convId, userId, initialMessage]
    );

    return convId;
  });

  return reply.status(201).send({
    success: true,
    data: { conversationId: newConv }
  });
}

export async function getConversationMessages(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id: conversationId } = request.params as { id: string };

  // BOLA authorization: Check participation
  const partRes = await query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (partRes.rows.length === 0 && request.user!.role !== 'ADMIN') {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not a participant of this conversation.' }
    });
  }

  const res = await query(
    `SELECT m.id, m.sender_id, m.content, m.created_at,
            up.first_name AS sender_name, up.avatar_url AS sender_avatar
     FROM messages m
     JOIN user_profiles up ON up.user_id = m.sender_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
    [conversationId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar,
      content: row.content,
      createdAt: row.created_at,
      isMe: row.sender_id === userId
    }))
  });
}

export async function sendMessage(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id: conversationId } = request.params as { id: string };

  const parseResult = sendMessageSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  // Authorization check
  const partRes = await query(
    'SELECT user_id FROM conversation_participants WHERE conversation_id = $1',
    [conversationId]
  );
  const isParticipant = partRes.rows.some((r) => r.user_id === userId);
  if (!isParticipant) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You are not a participant in this conversation.' }
    });
  }

  const { content } = parseResult.data;

  const msgRes = await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, content, created_at`,
      [conversationId, userId, content]
    );

    await client.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);
    return res.rows[0];
  });

  return reply.status(201).send({
    success: true,
    data: msgRes
  });
}
