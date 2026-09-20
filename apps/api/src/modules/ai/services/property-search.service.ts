// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — NATURAL LANGUAGE PROPERTY SEARCH SERVICE
// Transforms human search intent into strictly validated schema and parameterized SQL
// ==============================================================================

import { propertySearchQuerySchema, PropertySearchQuery } from '@betoch/validation';
import { getAIProvider } from '../providers/provider.factory.js';
import { query } from '../../../database/db.js';
import { AIObservabilityService } from './ai-observability.service.js';
import { AIFeatureKey } from '@betoch/shared';

export interface NLSearchResult {
  rawQuery: string;
  structuredFilters: PropertySearchQuery;
  interpretationSummary: string;
  totalMatches: number;
  properties: any[];
}

export class PropertySearchService {
  static async searchWithNaturalLanguage(
    rawQuery: string,
    userId?: string
  ): Promise<NLSearchResult> {
    const startTime = Date.now();
    const provider = getAIProvider();

    const prompt = `Convert the following real-estate search query for homes in Addis Ababa into structured search criteria:
Query: "${rawQuery}"

Allowed Fields:
- subCity: One of ["Bole", "Yeka", "Kirkos", "Arada", "Lideta", "Nifas Silk-Lafto", "Kolfe Keranio", "Gullele", "Addis Ketema", "Akaki Kality", "Lemi Kura"]
- propertyType: One of ["APARTMENT", "CONDOMINIUM", "VILLA", "STUDIO", "TOWNHOUSE", "GUESTHOUSE", "ROOM"]
- bedrooms: integer (e.g., 1, 2, 3)
- bathrooms: number (e.g., 1, 2)
- minRent: positive number in ETB
- maxRent: positive number in ETB
- furnished: boolean
- amenities: comma-separated string of amenities: ["water_tank", "generator", "wifi", "parking", "elevator", "security_guard", "cctv", "balcony"]`;

    const schemaDescription = `{
      "subCity": string (optional),
      "propertyType": string (optional),
      "bedrooms": number (optional),
      "bathrooms": number (optional),
      "minRent": number (optional),
      "maxRent": number (optional),
      "furnished": boolean (optional),
      "amenities": string (optional)
    }`;

    let extracted: any = {};
    try {
      extracted = await provider.generateStructured(prompt, schemaDescription);
    } catch {
      extracted = {};
    }

    // Strict validation and sanitization using Zod schema
    // AI CANNOT inject arbitrary SQL or unvalidated fields!
    const validated = propertySearchQuerySchema.safeParse({
      subCity: extracted.subCity,
      propertyType: extracted.propertyType,
      bedrooms: extracted.bedrooms,
      bathrooms: extracted.bathrooms,
      minRent: extracted.minRent,
      maxRent: extracted.maxRent,
      furnished: extracted.furnished !== undefined ? String(extracted.furnished) : undefined,
      amenities: extracted.amenities,
      limit: 12,
      page: 1
    });

    const filters = validated.success ? validated.data : { limit: 12, page: 1, sortBy: 'newest' as const };

    // Execute Parameterized Query
    const conditions: string[] = ["p.listing_status = 'PUBLISHED'", 'p.deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.subCity) {
      conditions.push(`LOWER(p.sub_city) = LOWER($${paramIndex})`);
      values.push(filters.subCity);
      paramIndex++;
    }

    if (filters.propertyType) {
      conditions.push(`p.property_type = $${paramIndex}`);
      values.push(filters.propertyType);
      paramIndex++;
    }

    if (filters.bedrooms !== undefined) {
      conditions.push(`p.bedrooms >= $${paramIndex}`);
      values.push(filters.bedrooms);
      paramIndex++;
    }

    if (filters.bathrooms !== undefined) {
      conditions.push(`p.bathrooms >= $${paramIndex}`);
      values.push(filters.bathrooms);
      paramIndex++;
    }

    if (filters.minRent !== undefined) {
      conditions.push(`p.monthly_rent >= $${paramIndex}`);
      values.push(filters.minRent);
      paramIndex++;
    }

    if (filters.maxRent !== undefined) {
      conditions.push(`p.monthly_rent <= $${paramIndex}`);
      values.push(filters.maxRent);
      paramIndex++;
    }

    if (filters.furnished !== undefined) {
      conditions.push(`p.furnished = $${paramIndex}`);
      values.push(filters.furnished);
      paramIndex++;
    }

    if (filters.amenities) {
      const amenityList = filters.amenities.split(',').map((a) => a.trim()).filter(Boolean);
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

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const sql = `
      SELECT 
        p.id, p.title, p.slug, p.description, p.property_type, p.bedrooms, p.bathrooms,
        p.floor, p.size_sqm, p.furnished, p.city, p.sub_city, p.neighborhood,
        p.monthly_rent, p.deposit_amount, p.currency, p.verification_status, p.created_at,
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
        ) AS amenities
      FROM properties p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex}
    `;

    const dbRes = await query(sql, [...values, filters.limit || 12]);
    const properties = dbRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      propertyType: row.property_type,
      bedrooms: row.bedrooms,
      bathrooms: Number(row.bathrooms),
      sizeSqm: Number(row.size_sqm),
      furnished: row.furnished,
      location: {
        city: row.city,
        subCity: row.sub_city,
        neighborhood: row.neighborhood
      },
      pricing: {
        monthlyRent: Number(row.monthly_rent),
        depositAmount: Number(row.deposit_amount),
        currency: row.currency
      },
      verificationStatus: row.verification_status,
      primaryImage: row.primary_image ? row.primary_image.url : null,
      amenities: row.amenities
    }));

    // Generate human-friendly summary
    const parts: string[] = [];
    if (filters.bedrooms) parts.push(`${filters.bedrooms} bedroom`);
    if (filters.propertyType) parts.push(filters.propertyType.toLowerCase());
    if (filters.subCity) parts.push(`in ${filters.subCity}`);
    if (filters.maxRent) parts.push(`under ${filters.maxRent.toLocaleString()} ETB`);
    if (filters.amenities) parts.push(`with ${filters.amenities.replace(/,/g, ', ')}`);
    const interpretationSummary = parts.length > 0 ? `Searching for ${parts.join(' ')}` : `Searching all listings`;

    // Record user search history for personalized recommendations
    if (userId) {
      await query(
        `INSERT INTO user_search_history (user_id, raw_query, structured_filters, results_count)
         VALUES ($1, $2, $3, $4)`,
        [userId, rawQuery, JSON.stringify(filters), properties.length]
      ).catch(() => {});
    }

    const latencyMs = Date.now() - startTime;
    await AIObservabilityService.recordRequest({
      feature: AIFeatureKey.AI_PROPERTY_SEARCH,
      userId,
      provider: provider.name,
      model: provider.modelName,
      latencyMs,
      tokensUsed: 120,
      estimatedCostUsd: 0.0001,
      success: true
    });

    return {
      rawQuery,
      structuredFilters: filters,
      interpretationSummary,
      totalMatches: properties.length,
      properties
    };
  }
}
