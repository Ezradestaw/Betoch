// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — PROPERTY COMPARISON SERVICE
// Objective side-by-side property comparison based strictly on database records
// ==============================================================================

import { query } from '../../../database/db.js';

export interface PropertyComparisonResult {
  properties: Array<{
    id: string;
    title: string;
    slug: string;
    subCity: string;
    neighborhood: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    sizeSqm: number;
    monthlyRent: number;
    depositAmount: number;
    furnished: boolean;
    verificationStatus: string;
    primaryImage: string | null;
    amenities: string[];
  }>;
  summaryHighlights: {
    lowestRentId: string;
    largestSizeId: string;
    mostAmenitiesId: string;
  };
  comparisonNarrative: string;
}

export class PropertyComparisonService {
  static async compareProperties(propertyIds: string[]): Promise<PropertyComparisonResult> {
    const dbRes = await query(
      `SELECT 
        p.id, p.title, p.slug, p.property_type, p.bedrooms, p.bathrooms,
        p.size_sqm, p.furnished, p.sub_city, p.neighborhood, p.monthly_rent,
        p.deposit_amount, p.verification_status,
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
      WHERE p.id = ANY($1::uuid[]) AND p.deleted_at IS NULL`,
      [propertyIds]
    );

    if (dbRes.rows.length < 2) {
      throw new Error('At least 2 valid properties are required for comparison.');
    }

    const properties = dbRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      subCity: row.sub_city,
      neighborhood: row.neighborhood,
      propertyType: row.property_type,
      bedrooms: row.bedrooms,
      bathrooms: Number(row.bathrooms),
      sizeSqm: Number(row.size_sqm),
      monthlyRent: Number(row.monthly_rent),
      depositAmount: Number(row.deposit_amount),
      furnished: row.furnished,
      verificationStatus: row.verification_status,
      primaryImage: row.primary_image ? row.primary_image.url : null,
      amenities: row.amenities || []
    }));

    // Identify winners
    const sortedByRent = [...properties].sort((a, b) => a.monthlyRent - b.monthlyRent);
    const sortedBySize = [...properties].sort((a, b) => b.sizeSqm - a.sizeSqm);
    const sortedByAmenities = [...properties].sort((a, b) => b.amenities.length - a.amenities.length);

    const lowestRent = sortedByRent[0];
    const largestSize = sortedBySize[0];
    const mostAmenities = sortedByAmenities[0];

    const narrative = `Comparing ${properties.length} options: "${lowestRent.title}" offers the most economical rent at ${lowestRent.monthlyRent.toLocaleString()} ETB/month in ${lowestRent.subCity}. If living space is your primary requirement, "${largestSize.title}" provides the most expansive area with ${largestSize.sizeSqm} m². For utility convenience and backup systems, "${mostAmenities.title}" includes the highest number of amenities (${mostAmenities.amenities.length} features).`;

    return {
      properties,
      summaryHighlights: {
        lowestRentId: lowestRent.id,
        largestSizeId: largestSize.id,
        mostAmenitiesId: mostAmenities.id
      },
      comparisonNarrative: narrative
    };
  }
}
