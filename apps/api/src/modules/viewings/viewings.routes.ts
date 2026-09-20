// ==============================================================================
// BETOCH VIEWING REQUESTS MODULE — ROUTES & CONTROLLERS
// ==============================================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../../database/db.js';
import { authenticate } from '../../middleware/auth.js';
import { updateViewingStatusSchema } from '@betoch/validation';

export async function getMyViewingRequests(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const res = await query(
    `SELECT 
      v.id, v.property_id, v.proposed_date, v.time_slot, v.status, v.notes,
      v.rejection_reason, v.created_at, v.updated_at,
      p.title AS property_title, p.slug AS property_slug, p.monthly_rent,
      p.sub_city, p.neighborhood,
      u.email AS owner_email,
      up.first_name AS owner_first_name, up.last_name AS owner_last_name,
      up.phone_number AS owner_phone,
      (
        SELECT pi.image_url FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) AS primary_image
     FROM property_viewing_requests v
     JOIN properties p ON p.id = v.property_id
     JOIN users u ON u.id = p.owner_id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE v.renter_id = $1
     ORDER BY v.proposed_date DESC, v.created_at DESC`,
    [userId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      propertyTitle: r.property_title,
      propertySlug: r.property_slug,
      monthlyRent: Number(r.monthly_rent),
      subCity: r.sub_city,
      neighborhood: r.neighborhood,
      primaryImage: r.primary_image,
      ownerName: `${r.owner_first_name || ''} ${r.owner_last_name || ''}`.trim() || 'Property Owner',
      ownerPhone: r.owner_phone,
      proposedDate: r.proposed_date,
      timeSlot: r.time_slot,
      status: r.status,
      notes: r.notes,
      rejectionReason: r.rejection_reason,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }))
  });
}

export async function getOwnerViewingRequests(request: FastifyRequest, reply: FastifyReply) {
  const ownerId = request.user!.id;

  const res = await query(
    `SELECT 
      v.id, v.property_id, v.renter_id, v.proposed_date, v.time_slot, v.status, v.notes,
      v.rejection_reason, v.created_at, v.updated_at,
      p.title AS property_title, p.slug AS property_slug, p.monthly_rent,
      u.email AS renter_email,
      up.first_name AS renter_first_name, up.last_name AS renter_last_name,
      up.phone_number AS renter_phone,
      (
        SELECT pi.image_url FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) AS primary_image
     FROM property_viewing_requests v
     JOIN properties p ON p.id = v.property_id
     JOIN users u ON u.id = v.renter_id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE p.owner_id = $1
     ORDER BY v.proposed_date ASC, v.created_at DESC`,
    [ownerId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      propertyTitle: r.property_title,
      propertySlug: r.property_slug,
      monthlyRent: Number(r.monthly_rent),
      primaryImage: r.primary_image,
      renterId: r.renter_id,
      renterName: `${r.renter_first_name || ''} ${r.renter_last_name || ''}`.trim() || 'Prospective Tenant',
      renterEmail: r.renter_email,
      renterPhone: r.renter_phone,
      proposedDate: r.proposed_date,
      timeSlot: r.time_slot,
      status: r.status,
      notes: r.notes,
      rejectionReason: r.rejection_reason,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }))
  });
}

export async function updateViewingStatus(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const parseResult = updateViewingStatusSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { status, rejectionReason } = parseResult.data;

  // Verify ownership or renter authorization
  const viewRes = await query(
    `SELECT v.id, v.renter_id, v.property_id, p.owner_id, p.title AS property_title
     FROM property_viewing_requests v
     JOIN properties p ON p.id = v.property_id
     WHERE v.id = $1`,
    [id]
  );

  if (viewRes.rows.length === 0) {
    return reply.status(404).send({ success: false, message: 'Viewing request not found' });
  }

  const viewing = viewRes.rows[0];
  const isOwner = viewing.owner_id === userId;
  const isRenter = viewing.renter_id === userId;

  if (!isOwner && !isRenter) {
    return reply.status(403).send({ success: false, message: 'Unauthorized to update this viewing request' });
  }

  await query(
    `UPDATE property_viewing_requests
     SET status = $1, rejection_reason = $2, updated_at = NOW()
     WHERE id = $3`,
    [status, rejectionReason || null, id]
  );

  // Send in-app notification to the other party
  const notifyRecipientId = isOwner ? viewing.renter_id : viewing.owner_id;
  const title = `Viewing Request ${status}`;
  const message = isOwner
    ? `The landlord has marked your viewing request for "${viewing.property_title}" as ${status}.`
    : `The renter has marked the viewing request for "${viewing.property_title}" as ${status}.`;

  await query(
    `INSERT INTO notifications (user_id, title, message, type, link_url)
     VALUES ($1, $2, $3, 'VIEWING', $4)`,
    [notifyRecipientId, title, message, `/renter/applications`]
  );

  return reply.send({
    success: true,
    message: `Viewing request status updated to ${status}.`,
    data: { id, status }
  });
}

export async function viewingsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/my-requests', getMyViewingRequests);
  fastify.get('/owner-requests', getOwnerViewingRequests);
  fastify.patch('/:id/status', updateViewingStatus);
}
