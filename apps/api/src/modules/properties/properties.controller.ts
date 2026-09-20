import { FastifyRequest, FastifyReply } from 'fastify';
import { propertySearchQuerySchema, fullPropertyCreateSchema } from '@betoch/validation';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function searchProperties(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = propertySearchQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors }
    });
  }

  const {
    query: searchKeyword,
    subCity,
    neighborhood,
    propertyType,
    minRent,
    maxRent,
    bedrooms,
    bathrooms,
    furnished,
    verifiedOnly,
    amenities,
    sortBy,
    page,
    limit
  } = parseResult.data;

  const conditions: string[] = ["p.listing_status = 'PUBLISHED'", 'p.deleted_at IS NULL'];
  const values: any[] = [];
  let paramIndex = 1;

  if (searchKeyword && searchKeyword.trim()) {
    conditions.push(`p.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
    values.push(searchKeyword.trim());
    paramIndex++;
  }

  if (subCity) {
    conditions.push(`LOWER(p.sub_city) = LOWER($${paramIndex})`);
    values.push(subCity);
    paramIndex++;
  }

  if (neighborhood) {
    conditions.push(`p.neighborhood ILIKE $${paramIndex}`);
    values.push(`%${neighborhood}%`);
    paramIndex++;
  }

  if (propertyType) {
    conditions.push(`p.property_type = $${paramIndex}`);
    values.push(propertyType);
    paramIndex++;
  }

  if (minRent !== undefined) {
    conditions.push(`p.monthly_rent >= $${paramIndex}`);
    values.push(minRent);
    paramIndex++;
  }

  if (maxRent !== undefined) {
    conditions.push(`p.monthly_rent <= $${paramIndex}`);
    values.push(maxRent);
    paramIndex++;
  }

  if (bedrooms !== undefined) {
    conditions.push(`p.bedrooms >= $${paramIndex}`);
    values.push(bedrooms);
    paramIndex++;
  }

  if (bathrooms !== undefined) {
    conditions.push(`p.bathrooms >= $${paramIndex}`);
    values.push(bathrooms);
    paramIndex++;
  }

  if (furnished !== undefined) {
    conditions.push(`p.furnished = $${paramIndex}`);
    values.push(furnished);
    paramIndex++;
  }

  if (verifiedOnly) {
    conditions.push(`p.verification_status = 'VERIFIED'`);
  }

  if (amenities) {
    const amenityList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (amenityList.length > 0) {
      conditions.push(`
        p.id IN (
          SELECT property_id FROM property_amenities
          WHERE amenity_id = ANY($${paramIndex}::varchar[])
          GROUP BY property_id
          HAVING COUNT(DISTINCT amenity_id) = ${amenityList.length}
        )
      `);
      values.push(amenityList);
      paramIndex++;
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Order By
  let orderBy = 'p.created_at DESC';
  if (sortBy === 'price_asc') orderBy = 'p.monthly_rent ASC';
  if (sortBy === 'price_desc') orderBy = 'p.monthly_rent DESC';
  if (sortBy === 'size_desc') orderBy = 'p.size_sqm DESC';

  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) FROM properties p ${whereClause}`;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const dataQuery = `
    SELECT 
      p.id, p.title, p.slug, p.description, p.property_type, p.bedrooms, p.bathrooms,
      p.floor, p.total_floors, p.size_sqm, p.furnished, p.country, p.city, p.sub_city,
      p.woreda, p.neighborhood, p.monthly_rent, p.deposit_amount, p.currency,
      p.verification_status, p.listing_status, p.created_at,
      (
        SELECT json_build_object('url', pi.image_url, 'isPrimary', pi.is_primary)
        FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) AS primary_image,
      (
        SELECT COALESCE(json_agg(pa.amenity_id), '[]'::json)
        FROM property_amenities pa
        WHERE pa.property_id = p.id
      ) AS amenities,
      json_build_object(
        'firstName', up.first_name,
        'identityStatus', up.identity_status
      ) AS owner_summary
    FROM properties p
    LEFT JOIN user_profiles up ON up.user_id = p.owner_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const dataRes = await query(dataQuery, [...values, limit, offset]);

  return reply.send({
    success: true,
    data: {
      items: dataRes.rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        propertyType: row.property_type,
        bedrooms: row.bedrooms,
        bathrooms: Number(row.bathrooms),
        floor: row.floor,
        totalFloors: row.total_floors,
        sizeSqm: Number(row.size_sqm),
        furnished: row.furnished,
        location: {
          country: row.country,
          city: row.city,
          subCity: row.sub_city,
          woreda: row.woreda,
          neighborhood: row.neighborhood
        },
        pricing: {
          monthlyRent: Number(row.monthly_rent),
          depositAmount: Number(row.deposit_amount),
          currency: row.currency
        },
        verificationStatus: row.verification_status,
        listingStatus: row.listing_status,
        createdAt: row.created_at,
        primaryImage: row.primary_image ? row.primary_image.url : null,
        amenities: row.amenities,
        owner: row.owner_summary
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}

export async function getPropertyDetails(request: FastifyRequest, reply: FastifyReply) {
  const { idOrSlug } = request.params as { idOrSlug: string };
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);

  const sql = `
    SELECT 
      p.*,
      up.first_name, up.last_name, up.avatar_url, up.identity_status, up.bio,
      u.created_at AS owner_member_since
    FROM properties p
    JOIN users u ON u.id = p.owner_id
    JOIN user_profiles up ON up.user_id = p.owner_id
    WHERE (p.${isUuid ? 'id' : 'slug'} = $1)
      AND p.deleted_at IS NULL
  `;

  const res = await query(sql, [idOrSlug]);
  if (res.rows.length === 0) {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Property not found.' }
    });
  }

  const p = res.rows[0];

  // Fetch images
  const imagesRes = await query(
    'SELECT id, image_url, is_primary, display_order FROM property_images WHERE property_id = $1 ORDER BY is_primary DESC, display_order ASC',
    [p.id]
  );

  // Fetch amenities
  const amenitiesRes = await query(
    `SELECT a.id, a.name, a.category, a.icon
     FROM property_amenities pa
     JOIN amenities a ON a.id = pa.amenity_id
     WHERE pa.property_id = $1`,
    [p.id]
  );

  // Fetch reviews summary
  const reviewsRes = await query(
    `SELECT AVG(rating_overall)::numeric(2,1) AS avg_rating, COUNT(*) AS review_count
     FROM reviews WHERE property_id = $1`,
    [p.id]
  );

  return reply.send({
    success: true,
    data: {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      propertyType: p.property_type,
      bedrooms: p.bedrooms,
      bathrooms: Number(p.bathrooms),
      floor: p.floor,
      totalFloors: p.total_floors,
      sizeSqm: Number(p.size_sqm),
      furnished: p.furnished,
      location: {
        country: p.country,
        city: p.city,
        subCity: p.sub_city,
        woreda: p.woreda,
        neighborhood: p.neighborhood,
        latitudeApprox: p.latitude_approx ? Number(p.latitude_approx) : null,
        longitudeApprox: p.longitude_approx ? Number(p.longitude_approx) : null
      },
      pricing: {
        monthlyRent: Number(p.monthly_rent),
        depositAmount: Number(p.deposit_amount),
        currency: p.currency,
        leaseDurationMonths: p.lease_duration_months,
        utilitiesIncluded: p.utilities_included
      },
      verificationStatus: p.verification_status,
      listingStatus: p.listing_status,
      availableFrom: p.available_from,
      createdAt: p.created_at,
      images: imagesRes.rows.map((img) => ({
        id: img.id,
        url: img.image_url,
        isPrimary: img.is_primary,
        displayOrder: img.display_order
      })),
      amenities: amenitiesRes.rows,
      rating: {
        avgRating: reviewsRes.rows[0].avg_rating ? Number(reviewsRes.rows[0].avg_rating) : null,
        reviewCount: parseInt(reviewsRes.rows[0].review_count, 10)
      },
      owner: {
        id: p.owner_id,
        firstName: p.first_name,
        avatarUrl: p.avatar_url,
        identityStatus: p.identity_status,
        bio: p.bio,
        memberSince: p.owner_member_since
      }
    }
  });
}

export async function createProperty(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const parseResult = fullPropertyCreateSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid property listing input',
        details: parseResult.error.flatten().fieldErrors
      }
    });
  }

  const d = parseResult.data;
  const baseSlug = slugify(d.title);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const slug = `${baseSlug}-${randomSuffix}`;

  // Check owner identity status
  const userProfile = await query('SELECT identity_status FROM user_profiles WHERE user_id = $1', [userId]);
  const isOwnerVerified = userProfile.rows[0]?.identity_status === 'VERIFIED';

  const newProperty = await withTransaction(async (client) => {
    const propRes = await client.query(
      `INSERT INTO properties (
        owner_id, title, slug, description, property_type, bedrooms, bathrooms, floor, total_floors,
        size_sqm, furnished, country, city, sub_city, woreda, neighborhood, latitude_approx, longitude_approx,
        monthly_rent, deposit_amount, currency, lease_duration_months, available_from, utilities_included,
        verification_status, listing_status, title_deed_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, 'ETB', $21, $22, $23,
        $24, $25, $26
      ) RETURNING id, slug, title`,
      [
        userId,
        d.title,
        slug,
        d.description,
        d.propertyType,
        d.bedrooms,
        d.bathrooms,
        d.floor || 0,
        d.totalFloors || null,
        d.sizeSqm,
        d.furnished,
        d.country,
        d.city,
        d.subCity,
        d.woreda || null,
        d.neighborhood,
        d.latitudeApprox || null,
        d.longitudeApprox || null,
        d.monthlyRent,
        d.depositAmount,
        d.leaseDurationMonths,
        d.availableFrom,
        d.utilitiesIncluded,
        isOwnerVerified ? 'UNDER_REVIEW' : 'DRAFT',
        'PUBLISHED',
        d.titleDeedUrl || null
      ]
    );

    const prop = propRes.rows[0];

    // Insert images
    for (let i = 0; i < d.imageUrls.length; i++) {
      await client.query(
        `INSERT INTO property_images (property_id, image_url, is_primary, display_order)
         VALUES ($1, $2, $3, $4)`,
        [prop.id, d.imageUrls[i], i === d.primaryImageIndex, i]
      );
    }

    // Insert amenities
    for (const aId of d.amenityIds) {
      await client.query(
        `INSERT INTO property_amenities (property_id, amenity_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [prop.id, aId]
      );
    }

    return prop;
  });

  await logAuditEvent({
    actorId: userId,
    action: 'PROPERTY_CREATED',
    resourceType: 'properties',
    resourceId: newProperty.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { title: newProperty.title, slug: newProperty.slug }
  });

  return reply.status(201).send({
    success: true,
    data: newProperty
  });
}

export async function getMyListings(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const res = await query(
    `SELECT p.*,
      (
        SELECT pi.image_url FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) AS primary_image,
      (
        SELECT COUNT(*) FROM rental_applications ra
        WHERE ra.property_id = p.id
      ) AS application_count
     FROM properties p
     WHERE p.owner_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return reply.send({
    success: true,
    data: res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      propertyType: row.property_type,
      monthlyRent: Number(row.monthly_rent),
      subCity: row.sub_city,
      neighborhood: row.neighborhood,
      verificationStatus: row.verification_status,
      listingStatus: row.listing_status,
      primaryImage: row.primary_image,
      applicationCount: parseInt(row.application_count, 10),
      createdAt: row.created_at
    }))
  });
}
