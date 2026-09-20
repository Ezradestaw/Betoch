import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { submitReviewSchema } from '@betoch/validation';
import { query } from '../../database/db.js';
import { authenticate } from '../../middleware/auth.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function submitReview(request: FastifyRequest, reply: FastifyReply) {
  const authorId = request.user!.id;

  const parseResult = submitReviewSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const { contractId, ratingAccuracy, ratingCommunication, ratingOverall, comment } = parseResult.data;

  // Verify contract exists and author is renter of the contract
  const contractRes = await query(
    'SELECT property_id, renter_id, owner_id, status FROM rental_contracts WHERE id = $1',
    [contractId]
  );
  if (contractRes.rows.length === 0) {
    return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Contract not found.' } });
  }

  const contract = contractRes.rows[0];
  if (contract.renter_id !== authorId) {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the verified renter of this completed contract can write a review.' }
    });
  }

  // Check duplicate review
  const existingReview = await query('SELECT id FROM reviews WHERE contract_id = $1', [contractId]);
  if (existingReview.rows.length > 0) {
    return reply.status(409).send({
      success: false,
      error: { code: 'DUPLICATE_REVIEW', message: 'You have already reviewed this rental contract.' }
    });
  }

  const res = await query(
    `INSERT INTO reviews (
      contract_id, property_id, author_id, recipient_id, rating_accuracy, rating_communication, rating_overall, comment
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, rating_overall, comment, created_at`,
    [contractId, contract.property_id, authorId, contract.owner_id, ratingAccuracy, ratingCommunication, ratingOverall, comment]
  );

  await logAuditEvent({
    actorId: authorId,
    action: 'REVIEW_SUBMITTED',
    resourceType: 'reviews',
    resourceId: res.rows[0].id,
    metadata: { propertyId: contract.property_id, contractId }
  });

  return reply.status(201).send({
    success: true,
    data: res.rows[0]
  });
}

export async function getPropertyReviews(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { propertyId } = request.params as { propertyId: string };
  const res = await query(
    `SELECT r.id, r.rating_accuracy, r.rating_communication, r.rating_overall, r.comment, r.created_at,
            up.first_name, up.avatar_url
     FROM reviews r
     JOIN user_profiles up ON up.user_id = r.author_id
     WHERE r.property_id = $1
     ORDER BY r.created_at DESC`,
    [propertyId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      ratings: {
        accuracy: row.rating_accuracy,
        communication: row.rating_communication,
        overall: row.rating_overall
      },
      comment: row.comment,
      createdAt: row.created_at,
      author: {
        firstName: row.first_name,
        avatarUrl: row.avatar_url
      }
    }))
  });
}

export async function reviewsRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, submitReview);
  fastify.get('/property/:propertyId', getPropertyReviews);
}
