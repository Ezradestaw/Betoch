import { FastifyRequest, FastifyReply } from 'fastify';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function getAnalytics(request: FastifyRequest, reply: FastifyReply) {
  const usersRes = await query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
  const verifiedUsersRes = await query("SELECT COUNT(*) FROM user_profiles WHERE identity_status = 'VERIFIED'");
  const activeListingsRes = await query("SELECT COUNT(*) FROM properties WHERE listing_status = 'PUBLISHED' AND deleted_at IS NULL");
  const pendingIdVerifRes = await query("SELECT COUNT(*) FROM identity_verifications WHERE status = 'PENDING'");
  const pendingPropVerifRes = await query("SELECT COUNT(*) FROM properties WHERE verification_status = 'UNDER_REVIEW' AND deleted_at IS NULL");
  const contractsRes = await query("SELECT COUNT(*) FROM rental_contracts WHERE status = 'ACTIVE' OR status = 'COMPLETED'");
  const commissionsRes = await query("SELECT COALESCE(SUM(commission_amount), 0) AS total_commission FROM commissions WHERE status = 'PAID'");
  const reportsRes = await query("SELECT COUNT(*) FROM reports WHERE status = 'OPEN'");

  return reply.send({
    success: true,
    data: {
      totalUsers: parseInt(usersRes.rows[0].count, 10),
      verifiedUsers: parseInt(verifiedUsersRes.rows[0].count, 10),
      activeListings: parseInt(activeListingsRes.rows[0].count, 10),
      pendingIdentityVerifications: parseInt(pendingIdVerifRes.rows[0].count, 10),
      pendingPropertyVerifications: parseInt(pendingPropVerifRes.rows[0].count, 10),
      completedRentals: parseInt(contractsRes.rows[0].count, 10),
      totalCommissionEarnedETB: Number(commissionsRes.rows[0].total_commission),
      openReports: parseInt(reportsRes.rows[0].count, 10)
    }
  });
}

export async function getPendingVerifications(request: FastifyRequest, reply: FastifyReply) {
  const res = await query(
    `SELECT iv.id, iv.user_id, iv.id_type, iv.id_number_masked, iv.document_front_url,
            iv.document_back_url, iv.status, iv.created_at,
            u.email, u.phone, u.role,
            up.first_name, up.last_name
     FROM identity_verifications iv
     JOIN users u ON u.id = iv.user_id
     JOIN user_profiles up ON up.user_id = iv.user_id
     WHERE iv.status = 'PENDING'
     ORDER BY iv.created_at ASC`
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: `${row.first_name} ${row.last_name}`,
      email: row.email,
      phone: row.phone,
      role: row.role,
      idType: row.id_type,
      maskedId: row.id_number_masked,
      documentFrontUrl: row.document_front_url,
      documentBackUrl: row.document_back_url,
      submittedAt: row.created_at
    }))
  });
}

export async function getPendingProperties(request: FastifyRequest, reply: FastifyReply) {
  const res = await query(
    `SELECT p.id, p.title, p.property_type, p.sub_city, p.neighborhood, p.monthly_rent,
            p.verification_status, p.title_deed_url, p.created_at,
            u.email AS owner_email, u.phone AS owner_phone,
            up.first_name AS owner_first_name, up.last_name AS owner_last_name,
            up.identity_status AS owner_identity_status
     FROM properties p
     JOIN users u ON u.id = p.owner_id
     JOIN user_profiles up ON up.user_id = p.owner_id
     WHERE p.verification_status = 'UNDER_REVIEW' AND p.deleted_at IS NULL
     ORDER BY p.created_at ASC`
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      propertyType: row.property_type,
      subCity: row.sub_city,
      neighborhood: row.neighborhood,
      monthlyRent: Number(row.monthly_rent),
      verificationStatus: row.verification_status,
      titleDeedUrl: row.title_deed_url,
      owner: {
        name: `${row.owner_first_name} ${row.owner_last_name}`,
        email: row.owner_email,
        phone: row.owner_phone,
        identityStatus: row.owner_identity_status
      },
      createdAt: row.created_at
    }))
  });
}

export async function reviewPropertyVerification(
  request: FastifyRequest<{ Params: { id: string }; Body: { decision: 'VERIFIED' | 'REJECTED'; notes?: string } }>,
  reply: FastifyReply
) {
  const adminId = request.user!.id;
  const { id } = request.params;
  const { decision, notes } = request.body;

  const propRes = await query('SELECT owner_id, title FROM properties WHERE id = $1', [id]);
  if (propRes.rows.length === 0) {
    return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found.' } });
  }

  const prop = propRes.rows[0];

  await withTransaction(async (client) => {
    await client.query(
      'UPDATE properties SET verification_status = $1, updated_at = NOW() WHERE id = $2',
      [decision, id]
    );

    // Notify owner
    const title = decision === 'VERIFIED' ? 'Listing Verified!' : 'Listing Verification Update';
    const message = decision === 'VERIFIED'
      ? `Your property "${prop.title}" has been reviewed and awarded the Verified Property trust badge.`
      : `Your listing verification could not be approved: ${notes || 'Information provided did not meet verification criteria.'}`;

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [prop.owner_id, title, message, 'PROPERTY_' + decision, `/properties/${id}`]
    );
  });

  await logAuditEvent({
    actorId: adminId,
    action: `PROPERTY_VERIFICATION_${decision}`,
    resourceType: 'properties',
    resourceId: id,
    metadata: { decision, notes }
  });

  return reply.send({ success: true, message: `Property marked as ${decision}.` });
}

export async function getCommissions(request: FastifyRequest, reply: FastifyReply) {
  const res = await query(
    `SELECT c.*,
            p.title AS property_title,
            up.first_name AS owner_first_name, up.last_name AS owner_last_name,
            u.email AS owner_email
     FROM commissions c
     JOIN rental_contracts rc ON rc.id = c.contract_id
     JOIN properties p ON p.id = rc.property_id
     JOIN users u ON u.id = c.owner_id
     JOIN user_profiles up ON up.user_id = c.owner_id
     ORDER BY c.created_at DESC`
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      contractId: row.contract_id,
      propertyTitle: row.property_title,
      owner: {
        name: `${row.owner_first_name} ${row.owner_last_name}`,
        email: row.owner_email
      },
      rentalAmount: Number(row.rental_amount),
      commissionRatePercent: Number(row.commission_rate_percent),
      commissionAmount: Number(row.commission_amount),
      currency: row.currency,
      ruleName: row.rule_name,
      status: row.status,
      createdAt: row.created_at
    }))
  });
}

export async function getReports(request: FastifyRequest, reply: FastifyReply) {
  const res = await query(
    `SELECT rep.*,
            up_reporter.first_name AS reporter_name,
            u_reporter.email AS reporter_email,
            p.title AS property_title
     FROM reports rep
     JOIN users u_reporter ON u_reporter.id = rep.reporter_id
     JOIN user_profiles up_reporter ON up_reporter.user_id = rep.reporter_id
     LEFT JOIN properties p ON p.id = rep.property_id
     ORDER BY rep.created_at DESC`
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      reporterName: row.reporter_name,
      reporterEmail: row.reporter_email,
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.created_at
    }))
  });
}

export async function getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
  const res = await query(
    `SELECT al.*, u.email AS actor_email, up.first_name AS actor_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id
     LEFT JOIN user_profiles up ON up.user_id = al.actor_id
     ORDER BY al.created_at DESC
     LIMIT 50`
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      actor: row.actor_email ? `${row.actor_name || ''} (${row.actor_email})` : 'System / Unauthenticated',
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata,
      createdAt: row.created_at
    }))
  });
}
