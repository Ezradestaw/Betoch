import { FastifyRequest, FastifyReply } from 'fastify';
import { initiateTelebirrPaymentSchema } from '@betoch/validation';
import { telebirrService } from './telebirr.service.js';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function initiatePayment(request: FastifyRequest, reply: FastifyReply) {
  const payerId = request.user!.id;

  const parseResult = initiateTelebirrPaymentSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { contractId, amount, paymentType } = parseResult.data;

  // Validate contract exists
  const contractRes = await query(
    `SELECT rc.id, rc.owner_id, rc.renter_id, p.title AS property_title, c.id AS commission_id, c.commission_amount
     FROM rental_contracts rc
     JOIN properties p ON p.id = rc.property_id
     LEFT JOIN commissions c ON c.contract_id = rc.id
     WHERE rc.id = $1`,
    [contractId]
  );

  if (contractRes.rows.length === 0) {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Rental contract not found.' }
    });
  }

  const contract = contractRes.rows[0];

  // Generate unique outTradeNo
  const outTradeNo = `BETOCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Insert payment record with INITIATED status
  await query(
    `INSERT INTO payments (
      contract_id, commission_id, payer_id, provider, out_trade_no,
      amount, currency, payment_type, status
    ) VALUES ($1, $2, $3, 'TELEBIRR', $4, $5, 'ETB', $6, 'INITIATED')`,
    [contractId, contract.commission_id, payerId, outTradeNo, amount, paymentType]
  );

  const initResult = await telebirrService.initiatePayment({
    outTradeNo,
    amount,
    subject: `Betoch Rental: ${contract.property_title}`,
    notifyUrl: `${request.protocol}://${request.hostname}/api/v1/payments/telebirr/webhook`,
    returnUrl: `${request.protocol}://${request.hostname.replace(':4000', ':5173')}/payments/success`
  });

  await logAuditEvent({
    actorId: payerId,
    action: 'PAYMENT_INITIATED',
    resourceType: 'payments',
    resourceId: outTradeNo,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { outTradeNo, amount, provider: 'TELEBIRR' }
  });

  return reply.send({
    success: true,
    data: {
      outTradeNo,
      payUrl: initResult.payUrl,
      mode: initResult.mode
    }
  });
}

export async function handleTelebirrWebhook(request: FastifyRequest, reply: FastifyReply) {
  const payload: any = request.body || {};
  const signature = request.headers['x-signature'] as string || payload.sign || '';

  const isValid = telebirrService.verifySignature(payload, signature);
  if (!isValid) {
    console.warn('[Telebirr Webhook] Invalid signature attempt:', request.ip);
    return reply.status(400).send({ code: 400, message: 'SIGNATURE_VERIFICATION_FAILED' });
  }

  const { outTradeNo, tradeNo, totalAmount } = payload;

  // Idempotency check & transaction
  const paymentRes = await query(
    'SELECT id, contract_id, commission_id, status FROM payments WHERE out_trade_no = $1',
    [outTradeNo]
  );

  if (paymentRes.rows.length === 0) {
    return reply.status(404).send({ code: 404, message: 'PAYMENT_NOT_FOUND' });
  }

  const payment = paymentRes.rows[0];
  if (payment.status === 'COMPLETED') {
    // Already processed idempotently
    return reply.send({ code: 0, message: 'SUCCESS' });
  }

  await withTransaction(async (client) => {
    // 1. Mark payment as completed
    await client.query(
      `UPDATE payments
       SET status = 'COMPLETED', transaction_reference = $1, raw_callback_payload = $2, updated_at = NOW()
       WHERE id = $3`,
      [tradeNo || 'TB-' + Date.now(), JSON.stringify(payload), payment.id]
    );

    // 2. If commission payment, mark commission as PAID
    if (payment.commission_id) {
      await client.query(
        `UPDATE commissions SET status = 'PAID', updated_at = NOW() WHERE id = $1`,
        [payment.commission_id]
      );
    }
  });

  await logAuditEvent({
    action: 'PAYMENT_COMPLETED',
    resourceType: 'payments',
    resourceId: payment.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { outTradeNo, tradeNo, totalAmount }
  });

  return reply.send({ code: 0, message: 'SUCCESS' });
}

export async function simulateMockPaymentApproval(
  request: FastifyRequest<{ Params: { outTradeNo: string } }>,
  reply: FastifyReply
) {
  const { outTradeNo } = request.params;

  const paymentRes = await query('SELECT id, commission_id, status FROM payments WHERE out_trade_no = $1', [outTradeNo]);
  if (paymentRes.rows.length === 0) {
    return reply.status(404).send({ success: false, message: 'Payment record not found.' });
  }

  const payment = paymentRes.rows[0];

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE payments
       SET status = 'COMPLETED', transaction_reference = $1, updated_at = NOW()
       WHERE id = $2`,
      ['MOCK-TB-' + Date.now(), payment.id]
    );

    if (payment.commission_id) {
      await client.query(
        `UPDATE commissions SET status = 'PAID', updated_at = NOW() WHERE id = $1`,
        [payment.commission_id]
      );
    }
  });

  return reply.send({
    success: true,
    message: 'Mock Telebirr payment simulation completed successfully.',
    data: { outTradeNo, status: 'COMPLETED' }
  });
}

export async function getPaymentStatus(
  request: FastifyRequest<{ Params: { outTradeNo: string } }>,
  reply: FastifyReply
) {
  const { outTradeNo } = request.params;
  const res = await query(
    `SELECT id, out_trade_no, amount, currency, payment_type, status, created_at
     FROM payments WHERE out_trade_no = $1`,
    [outTradeNo]
  );

  if (res.rows.length === 0) {
    return reply.status(404).send({ success: false, message: 'Payment not found' });
  }

  return reply.send({
    success: true,
    data: res.rows[0]
  });
}
