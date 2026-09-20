import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { submitIdentityVerificationSchema, reviewIdentityVerificationSchema } from '@betoch/validation';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function submitIdentityVerification(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const parseResult = submitIdentityVerificationSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { idType, idNumber, documentFrontUrl, documentBackUrl } = parseResult.data;

  // SHA-256 hash for duplicate detection
  const idHash = crypto.createHash('sha256').update(idNumber.trim()).digest('hex');

  // Check if this ID is already registered to another active user
  const duplicateCheck = await query(
    `SELECT user_id FROM identity_verifications
     WHERE id_number_hash = $1 AND user_id != $2 AND status = 'APPROVED'`,
    [idHash, userId]
  );

  if (duplicateCheck.rows.length > 0) {
    return reply.status(409).send({
      success: false,
      error: { code: 'DUPLICATE_IDENTITY', message: 'This identification document is already registered to another account.' }
    });
  }

  // Mask ID (keep first 4 and last 4 chars)
  const trimmed = idNumber.trim();
  const masked = trimmed.length > 8
    ? `${trimmed.slice(0, 3)}-••••-${trimmed.slice(-4)}`
    : `••••-${trimmed.slice(-3)}`;

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO identity_verifications (
        user_id, id_type, id_number_hash, id_number_masked, document_front_url, document_back_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      [userId, idType, idHash, masked, documentFrontUrl, documentBackUrl || null]
    );

    await client.query(
      `UPDATE user_profiles SET identity_status = 'PENDING', updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  });

  await logAuditEvent({
    actorId: userId,
    action: 'IDENTITY_VERIFICATION_SUBMITTED',
    resourceType: 'identity_verifications',
    resourceId: userId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { idType, maskedId: masked }
  });

  return reply.status(201).send({
    success: true,
    message: 'Identity verification submitted successfully. Our trust & safety team will review it shortly.',
    data: { status: 'PENDING', maskedId: masked }
  });
}

export async function getIdentityVerificationStatus(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const res = await query(
    `SELECT id, id_type, id_number_masked, status, rejection_reason, created_at, reviewed_at
     FROM identity_verifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (res.rows.length === 0) {
    return reply.send({
      success: true,
      data: { status: 'UNVERIFIED' }
    });
  }

  const row = res.rows[0];
  return reply.send({
    success: true,
    data: {
      id: row.id,
      idType: row.id_type,
      maskedId: row.id_number_masked,
      status: row.status,
      rejectionReason: row.rejection_reason,
      submittedAt: row.created_at,
      reviewedAt: row.reviewed_at
    }
  });
}

export async function reviewIdentityVerification(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const adminId = request.user!.id;
  const { id } = request.params as { id: string };

  const parseResult = reviewIdentityVerificationSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { decision, rejectionReason } = parseResult.data;

  const verifRes = await query('SELECT user_id, status FROM identity_verifications WHERE id = $1', [id]);
  if (verifRes.rows.length === 0) {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Verification request not found.' }
    });
  }

  const targetUserId = verifRes.rows[0].user_id;

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE identity_verifications
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3, updated_at = NOW()
       WHERE id = $4`,
      [decision, adminId, rejectionReason || null, id]
    );

    const newProfileStatus = decision === 'APPROVED' ? 'VERIFIED' : decision;
    await client.query(
      `UPDATE user_profiles SET identity_status = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [newProfileStatus, targetUserId]
    );

    // Notify user
    const notificationTitle = decision === 'APPROVED' ? 'Identity Verified!' : 'Identity Verification Update';
    const notificationMsg = decision === 'APPROVED'
      ? 'Congratulations! Your identity has been verified on Betoch. Your profile and listings will now carry the Verified Trust badge.'
      : `Your verification could not be approved: ${rejectionReason || 'Please review your document images.'}`;

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES ($1, $2, $3, $4, '/profile/verification')`,
      [targetUserId, notificationTitle, notificationMsg, 'IDENTITY_VERIFICATION_' + decision]
    );
  });

  await logAuditEvent({
    actorId: adminId,
    action: `IDENTITY_VERIFICATION_${decision}`,
    resourceType: 'identity_verifications',
    resourceId: id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { targetUserId, decision, rejectionReason }
  });

  return reply.send({
    success: true,
    message: `Verification successfully marked as ${decision}.`
  });
}
