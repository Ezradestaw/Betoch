import { FastifyRequest, FastifyReply } from 'fastify';
import { submitRentalApplicationSchema, updateApplicationStatusSchema } from '@betoch/validation';
import { ApplicationStatus } from '@betoch/shared';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function submitApplication(request: FastifyRequest, reply: FastifyReply) {
  const renterId = request.user!.id;

  const parseResult = submitRentalApplicationSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { propertyId, proposedStartDate, occupantsCount, message } = parseResult.data;

  // Check property exists and is published
  const propRes = await query(
    'SELECT id, owner_id, title, listing_status, monthly_rent FROM properties WHERE id = $1 AND deleted_at IS NULL',
    [propertyId]
  );
  if (propRes.rows.length === 0 || propRes.rows[0].listing_status !== 'PUBLISHED') {
    return reply.status(400).send({
      success: false,
      error: { code: 'PROPERTY_UNAVAILABLE', message: 'This property is not currently accepting applications.' }
    });
  }

  const property = propRes.rows[0];

  // Prevent owner applying to their own property
  if (property.owner_id === renterId) {
    return reply.status(400).send({
      success: false,
      error: { code: 'INVALID_ACTION', message: 'You cannot apply to your own property listing.' }
    });
  }

  // Prevent duplicate pending applications
  const existingApp = await query(
    `SELECT id FROM rental_applications
     WHERE property_id = $1 AND renter_id = $2 AND status IN ('SUBMITTED', 'UNDER_REVIEW')`,
    [propertyId, renterId]
  );
  if (existingApp.rows.length > 0) {
    return reply.status(409).send({
      success: false,
      error: { code: 'APPLICATION_EXISTS', message: 'You already have an active application for this property.' }
    });
  }

  const newApp = await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO rental_applications (
        property_id, renter_id, proposed_start_date, occupants_count, message, status
      ) VALUES ($1, $2, $3, $4, $5, 'SUBMITTED')
      RETURNING id, status, created_at`,
      [propertyId, renterId, proposedStartDate, occupantsCount, message]
    );

    // Notify owner
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES ($1, 'New Rental Application!', $2, 'APPLICATION_RECEIVED', $3)`,
      [
        property.owner_id,
        `You received a new rental application for "${property.title}".`,
        `/owner/applications`
      ]
    );

    return res.rows[0];
  });

  await logAuditEvent({
    actorId: renterId,
    action: 'APPLICATION_SUBMITTED',
    resourceType: 'rental_applications',
    resourceId: newApp.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { propertyId, proposedStartDate, occupantsCount }
  });

  return reply.status(201).send({
    success: true,
    message: 'Rental application submitted successfully.',
    data: newApp
  });
}

export async function getMyApplications(request: FastifyRequest, reply: FastifyReply) {
  const renterId = request.user!.id;
  const res = await query(
    `SELECT 
      ra.id, ra.property_id, ra.proposed_start_date, ra.occupants_count, ra.message,
      ra.status, ra.rejection_reason, ra.created_at,
      p.title AS property_title, p.slug AS property_slug, p.monthly_rent, p.deposit_amount,
      p.sub_city, p.neighborhood,
      (
        SELECT pi.image_url FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) AS primary_image,
      up.first_name AS owner_name,
      rc.id AS contract_id
     FROM rental_applications ra
     JOIN properties p ON p.id = ra.property_id
     JOIN user_profiles up ON up.user_id = p.owner_id
     LEFT JOIN rental_contracts rc ON rc.application_id = ra.id
     WHERE ra.renter_id = $1
     ORDER BY ra.created_at DESC`,
    [renterId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      propertySlug: row.property_slug,
      monthlyRent: Number(row.monthly_rent),
      depositAmount: Number(row.deposit_amount),
      subCity: row.sub_city,
      neighborhood: row.neighborhood,
      primaryImage: row.primary_image,
      ownerName: row.owner_name,
      proposedStartDate: row.proposed_start_date,
      occupantsCount: row.occupants_count,
      message: row.message,
      status: row.status,
      rejectionReason: row.rejection_reason,
      contractId: row.contract_id,
      createdAt: row.created_at
    }))
  });
}

export async function getPropertyApplications(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const ownerId = request.user!.id;
  const { propertyId } = request.params as { propertyId: string };

  // BOLA authorization
  const propRes = await query('SELECT owner_id FROM properties WHERE id = $1', [propertyId]);
  if (propRes.rows.length === 0 || propRes.rows[0].owner_id !== ownerId) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized to view applications for this listing.' }
    });
  }

  const res = await query(
    `SELECT 
      ra.id, ra.proposed_start_date, ra.occupants_count, ra.message, ra.status, ra.created_at,
      u.id AS renter_id, u.email AS renter_email, u.phone AS renter_phone,
      up.first_name AS renter_first_name, up.last_name AS renter_last_name,
      up.identity_status AS renter_identity_status,
      rc.id AS contract_id
     FROM rental_applications ra
     JOIN users u ON u.id = ra.renter_id
     JOIN user_profiles up ON up.user_id = u.id
     LEFT JOIN rental_contracts rc ON rc.application_id = ra.id
     WHERE ra.property_id = $1
     ORDER BY ra.created_at DESC`,
    [propertyId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      renter: {
        id: row.renter_id,
        name: `${row.renter_first_name} ${row.renter_last_name}`,
        email: row.renter_email,
        phone: row.renter_phone,
        identityStatus: row.renter_identity_status
      },
      proposedStartDate: row.proposed_start_date,
      occupantsCount: row.occupants_count,
      message: row.message,
      status: row.status,
      contractId: row.contract_id,
      createdAt: row.created_at
    }))
  });
}

export async function updateApplicationStatus(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const ownerId = request.user!.id;
  const { id } = request.params as { id: string };

  const parseResult = updateApplicationStatusSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { status, reason } = parseResult.data;

  // Fetch application and verify property ownership
  const appRes = await query(
    `SELECT ra.id, ra.property_id, ra.renter_id, ra.status, p.owner_id, p.title, p.monthly_rent
     FROM rental_applications ra
     JOIN properties p ON p.id = ra.property_id
     WHERE ra.id = $1`,
    [id]
  );

  if (appRes.rows.length === 0) {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Application not found.' }
    });
  }

  const app = appRes.rows[0];
  if (app.owner_id !== ownerId && request.user!.role !== 'ADMIN') {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized to modify this application.' }
    });
  }

  if (app.status !== 'SUBMITTED' && app.status !== 'UNDER_REVIEW') {
    return reply.status(400).send({
      success: false,
      error: { code: 'INVALID_TRANSITION', message: `Cannot change status from ${app.status} to ${status}.` }
    });
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE rental_applications
       SET status = $1, rejection_reason = $2, updated_at = NOW()
       WHERE id = $3`,
      [status, reason || null, id]
    );

    // Notify renter
    const msg = status === ApplicationStatus.ACCEPTED
      ? `Your application for "${app.title}" has been accepted! You can now proceed to confirm the rental agreement.`
      : `Your application for "${app.title}" was not accepted by the owner.`;

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES ($1, 'Application Update', $2, $3, '/renter/applications')`,
      [app.renter_id, msg, 'APPLICATION_' + status]
    );
  });

  await logAuditEvent({
    actorId: ownerId,
    action: `APPLICATION_${status}`,
    resourceType: 'rental_applications',
    resourceId: id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { propertyId: app.property_id, renterId: app.renter_id, status }
  });

  return reply.send({
    success: true,
    message: `Application marked as ${status}.`
  });
}
