import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../../database/db.js';
import { authenticate } from '../../middleware/auth.js';

export async function addFavorite(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { propertyId } = request.params as { propertyId: string };
  const { collectionName = 'My Favorites' } = (request.body as { collectionName?: string }) || {};

  await query(
    `INSERT INTO favorites (user_id, property_id, collection_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, property_id) 
     DO UPDATE SET collection_name = EXCLUDED.collection_name`,
    [userId, propertyId, collectionName]
  );

  return reply.send({ success: true, message: `Property saved to ${collectionName}.`, collectionName });
}

export async function removeFavorite(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { propertyId } = request.params as { propertyId: string };

  await query(
    'DELETE FROM favorites WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId]
  );

  return reply.send({ success: true, message: 'Property removed from favorites.' });
}

export async function getMyFavorites(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const res = await query(
    `SELECT 
      p.id, p.title, p.slug, p.property_type, p.bedrooms, p.bathrooms,
      p.size_sqm, p.sub_city, p.neighborhood, p.monthly_rent, p.currency,
      p.verification_status, f.collection_name, f.created_at AS favorited_at,
      (
        SELECT pi.image_url FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) AS primary_image
     FROM favorites f
     JOIN properties p ON p.id = f.property_id
     WHERE f.user_id = $1 AND p.deleted_at IS NULL
     ORDER BY f.created_at DESC`,
    [userId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      propertyType: row.property_type,
      bedrooms: row.bedrooms,
      bathrooms: Number(row.bathrooms),
      sizeSqm: Number(row.size_sqm),
      subCity: row.sub_city,
      neighborhood: row.neighborhood,
      monthlyRent: Number(row.monthly_rent),
      currency: row.currency,
      verificationStatus: row.verification_status,
      primaryImage: row.primary_image,
      collectionName: row.collection_name || 'My Favorites',
      favoritedAt: row.favorited_at
    }))
  });
}

export async function favoritesRoutes(fastify: FastifyInstance) {
  fastify.post('/:propertyId', { preHandler: [authenticate] }, addFavorite);
  fastify.delete('/:propertyId', { preHandler: [authenticate] }, removeFavorite);
  fastify.get('/', { preHandler: [authenticate] }, getMyFavorites);
}
