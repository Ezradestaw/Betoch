import { FastifyRequest, FastifyReply } from 'fastify';
import { completeRentalSchema } from '@betoch/validation';
import { config } from '@betoch/config';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function completeRental(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const parseResult = completeRentalSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { applicationId, governmentRegistrationNo } = parseResult.data;

  // Execute in isolated database transaction with row-level locking
  const contract = await withTransaction(async (client) => {
    // 1. Fetch application
    const appRes = await client.query(
      `SELECT ra.*, p.owner_id, p.monthly_rent, p.deposit_amount, p.title AS property_title
       FROM rental_applications ra
       JOIN properties p ON p.id = ra.property_id
       WHERE ra.id = $1`,
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new Error('Application not found.');
    }

    const app = appRes.rows[0];

    // Authorization: only owner or admin can finalize the rental
    if (app.owner_id !== userId && request.user!.role !== 'ADMIN') {
      const err: any = new Error('Only the property owner can finalize rental completion.');
      err.statusCode = 403;
      throw err;
    }

    if (app.status !== 'ACCEPTED') {
      const err: any = new Error('Application must be ACCEPTED before finalizing rental.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Lock property row to prevent concurrent race conditions
    const propLockRes = await client.query(
      `SELECT id, listing_status FROM properties WHERE id = $1 FOR UPDATE`,
      [app.property_id]
    );

    if (propLockRes.rows[0].listing_status === 'RENTED') {
      const err: any = new Error('This property has already been rented.');
      err.statusCode = 409;
      throw err;
    }

    // 3. Mark property as RENTED
    await client.query(
      `UPDATE properties SET listing_status = 'RENTED', updated_at = NOW() WHERE id = $1`,
      [app.property_id]
    );

    // 4. Create rental contract
    const startDate = app.proposed_start_date;
    const endDate = new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1))
      .toISOString()
      .split('T')[0];

    const contractRes = await client.query(
      `INSERT INTO rental_contracts (
        property_id, renter_id, owner_id, application_id, start_date, end_date,
        monthly_rent, deposit_amount, government_registration_no, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
      RETURNING id, start_date, end_date, monthly_rent, deposit_amount, government_registration_no`,
      [
        app.property_id,
        app.renter_id,
        app.owner_id,
        app.id,
        startDate,
        endDate,
        app.monthly_rent,
        app.deposit_amount,
        governmentRegistrationNo || null
      ]
    );
    const newContract = contractRes.rows[0];

    // 5. Calculate configurable commission
    const commissionRate = config.DEFAULT_COMMISSION_PERCENT; // 10.0%
    const monthlyRentNum = Number(app.monthly_rent);
    const commissionAmount = Number((monthlyRentNum * (commissionRate / 100)).toFixed(2));

    await client.query(
      `INSERT INTO commissions (
        contract_id, owner_id, rental_amount, commission_rate_percent,
        commission_amount, currency, rule_name, status
      ) VALUES ($1, $2, $3, $4, $5, 'ETB', 'STANDARD_TENANT_FINDER_2026', 'DUE')`,
      [newContract.id, app.owner_id, monthlyRentNum, commissionRate, commissionAmount]
    );

    // 6. Notify renter
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES ($1, 'Rental Confirmed!', $2, 'RENTAL_CONFIRMED', $3)`,
      [
        app.renter_id,
        `Congratulations! The rental for "${app.property_title}" has been completed.`,
        `/rentals/${newContract.id}`
      ]
    );

    return newContract;
  });

  await logAuditEvent({
    actorId: userId,
    action: 'RENTAL_CONTRACT_COMPLETED',
    resourceType: 'rental_contracts',
    resourceId: contract.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { contractId: contract.id }
  });

  return reply.status(201).send({
    success: true,
    message: 'Rental contract created successfully. Property status set to RENTED.',
    data: contract
  });
}

export async function getContractDetails(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  const res = await query(
    `SELECT rc.*,
      p.title AS property_title, p.sub_city, p.neighborhood,
      up_renter.first_name AS renter_first_name, up_renter.last_name AS renter_last_name,
      u_renter.email AS renter_email, u_renter.phone AS renter_phone,
      up_owner.first_name AS owner_first_name, up_owner.last_name AS owner_last_name,
      u_owner.email AS owner_email, u_owner.phone AS owner_phone,
      c.id AS commission_id, c.commission_amount, c.status AS commission_status,
      (
        SELECT pi.image_url FROM property_images pi
        WHERE pi.property_id = rc.property_id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) AS primary_image
     FROM rental_contracts rc
     JOIN properties p ON p.id = rc.property_id
     JOIN users u_renter ON u_renter.id = rc.renter_id
     JOIN user_profiles up_renter ON up_renter.user_id = rc.renter_id
     JOIN users u_owner ON u_owner.id = rc.owner_id
     JOIN user_profiles up_owner ON up_owner.user_id = rc.owner_id
     LEFT JOIN commissions c ON c.contract_id = rc.id
     WHERE rc.id = $1`,
    [id]
  );

  if (res.rows.length === 0) {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Rental contract not found.' }
    });
  }

  const row = res.rows[0];

  // BOLA authorization
  if (row.renter_id !== userId && row.owner_id !== userId && request.user!.role !== 'ADMIN') {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized to view this contract.' }
    });
  }

  return reply.send({
    success: true,
    data: {
      id: row.id,
      property: {
        id: row.property_id,
        title: row.property_title,
        subCity: row.sub_city,
        neighborhood: row.neighborhood,
        primaryImage: row.primary_image
      },
      renter: {
        id: row.renter_id,
        name: `${row.renter_first_name} ${row.renter_last_name}`,
        email: row.renter_email,
        phone: row.renter_phone
      },
      owner: {
        id: row.owner_id,
        name: `${row.owner_first_name} ${row.owner_last_name}`,
        email: row.owner_email,
        phone: row.owner_phone
      },
      terms: {
        startDate: row.start_date,
        endDate: row.end_date,
        monthlyRent: Number(row.monthly_rent),
        depositAmount: Number(row.deposit_amount),
        currency: 'ETB',
        governmentRegistrationNo: row.government_registration_no,
        status: row.status
      },
      commission: row.commission_id
        ? {
            id: row.commission_id,
            amount: Number(row.commission_amount),
            status: row.commission_status
          }
        : null,
      createdAt: row.created_at
    }
  });
}
