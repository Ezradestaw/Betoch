// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — PERSONALIZED RECOMMENDATIONS SERVICE
// Hybrid rule-based, content-similarity, and behavioral signal recommendations
// ==============================================================================

import { query } from '../../../database/db.js';

export interface RecommendationSet {
  recommendedForYou: any[];
  similarToFavorites: any[];
  newVerifiedListings: any[];
}

export class RecommendationService {
  static async getRecommendationsForUser(userId?: string): Promise<RecommendationSet> {
    const defaultSelect = `
      SELECT 
        p.id, p.title, p.slug, p.property_type, p.bedrooms, p.bathrooms,
        p.size_sqm, p.furnished, p.city, p.sub_city, p.neighborhood,
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
    `;

    // 1. New Verified Listings (Baseline high-trust)
    const newVerifiedRes = await query(
      `${defaultSelect}
       WHERE p.listing_status = 'PUBLISHED' 
         AND p.verification_status = 'VERIFIED'
         AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT 6`
    );
    const newVerifiedListings = newVerifiedRes.rows.map(this.formatPropertyRow);

    if (!userId) {
      return {
        recommendedForYou: newVerifiedListings.slice(0, 4),
        similarToFavorites: [],
        newVerifiedListings
      };
    }

    // 2. Extract Behavioral Signals from Favorites & Search History
    const favsRes = await query(
      `SELECT p.sub_city, p.property_type, p.monthly_rent, p.bedrooms
       FROM favorites f
       JOIN properties p ON p.id = f.property_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT 10`,
      [userId]
    );

    const searchRes = await query(
      `SELECT structured_filters
       FROM user_search_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Analyze favorite preferences
    const favoriteSubCities = [...new Set(favsRes.rows.map((r) => r.sub_city))];
    const favoriteTypes = [...new Set(favsRes.rows.map((r) => r.property_type))];
    const avgRent =
      favsRes.rows.length > 0
        ? favsRes.rows.reduce((sum, r) => sum + Number(r.monthly_rent), 0) / favsRes.rows.length
        : 35000;

    // 3. Similar to Favorites Query
    let similarToFavorites: any[] = [];
    if (favoriteSubCities.length > 0) {
      const simRes = await query(
        `${defaultSelect}
         WHERE p.listing_status = 'PUBLISHED'
           AND p.deleted_at IS NULL
           AND p.id NOT IN (SELECT property_id FROM favorites WHERE user_id = $1)
           AND (
             p.sub_city = ANY($2::varchar[])
             OR p.property_type = ANY($3::varchar[])
           )
           AND p.monthly_rent BETWEEN $4 AND $5
         ORDER BY p.created_at DESC
         LIMIT 6`,
        [userId, favoriteSubCities, favoriteTypes, avgRent * 0.7, avgRent * 1.35]
      );
      similarToFavorites = simRes.rows.map(this.formatPropertyRow);
    }

    // 4. "Recommended for You" Hybrid (combines searches + sub-cities)
    let recommendedForYou: any[] = [];
    const searchSubCities: string[] = [];
    searchRes.rows.forEach((row) => {
      if (row.structured_filters?.subCity) searchSubCities.push(row.structured_filters.subCity);
    });

    const combinedAreas = [...new Set([...favoriteSubCities, ...searchSubCities])];

    if (combinedAreas.length > 0) {
      const recRes = await query(
        `${defaultSelect}
         WHERE p.listing_status = 'PUBLISHED'
           AND p.deleted_at IS NULL
           AND p.sub_city = ANY($1::varchar[])
         ORDER BY (p.verification_status = 'VERIFIED') DESC, p.created_at DESC
         LIMIT 6`,
        [combinedAreas]
      );
      recommendedForYou = recRes.rows.map(this.formatPropertyRow);
    } else {
      recommendedForYou = newVerifiedListings.slice(0, 4);
    }

    return {
      recommendedForYou,
      similarToFavorites,
      newVerifiedListings
    };
  }

  private static formatPropertyRow(row: any) {
    return {
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
      amenities: row.amenities || []
    };
  }
}
