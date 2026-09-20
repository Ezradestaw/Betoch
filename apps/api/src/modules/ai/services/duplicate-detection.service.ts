// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — DUPLICATE DETECTION SERVICE
// Identifies potential duplicate listings and routes them to human Admin review
// ==============================================================================

import { query } from '../../../database/db.js';
import { DuplicateDetectionAlert } from '@betoch/shared';

export class DuplicateDetectionService {
  static async checkDuplicate(propertyId: string): Promise<DuplicateDetectionAlert> {
    const targetRes = await query(
      `SELECT p.id, p.owner_id, p.title, p.sub_city, p.woreda, p.neighborhood,
              p.property_type, p.bedrooms, p.bathrooms, p.monthly_rent, p.size_sqm, p.description
       FROM properties p WHERE p.id = $1`,
      [propertyId]
    );

    if (targetRes.rows.length === 0) {
      return { isPotentialDuplicate: false, similarityScore: 0, reasons: [] };
    }

    const target = targetRes.rows[0];

    // Find candidates in the same sub-city with same bedrooms and property type
    const candidatesRes = await query(
      `SELECT p.id, p.owner_id, p.title, p.sub_city, p.woreda, p.neighborhood,
              p.property_type, p.bedrooms, p.bathrooms, p.monthly_rent, p.size_sqm,
              similarity(p.description, $1) AS desc_similarity
       FROM properties p
       WHERE p.id != $2
         AND p.listing_status IN ('PUBLISHED', 'UNDER_REVIEW')
         AND p.deleted_at IS NULL
         AND LOWER(p.sub_city) = LOWER($3)
         AND p.property_type = $4
         AND p.bedrooms = $5
       ORDER BY desc_similarity DESC
       LIMIT 5`,
      [target.description, target.id, target.sub_city, target.property_type, target.bedrooms]
    );

    for (const candidate of candidatesRes.rows) {
      let similarityScore = 0;
      const reasons: string[] = [];

      // Same bedrooms and sub-city gives baseline 30
      similarityScore += 30;

      // Price match within 5%
      const targetRent = Number(target.monthly_rent);
      const candRent = Number(candidate.monthly_rent);
      if (Math.abs(targetRent - candRent) / targetRent <= 0.05) {
        similarityScore += 25;
        reasons.push(`Identical or nearly identical rent (${targetRent} ETB vs ${candRent} ETB)`);
      }

      // Size match within 5%
      const targetSize = Number(target.size_sqm);
      const candSize = Number(candidate.size_sqm);
      if (targetSize > 0 && Math.abs(targetSize - candSize) / targetSize <= 0.05) {
        similarityScore += 20;
        reasons.push(`Matching floor space (~${targetSize} m²)`);
      }

      // Neighborhood match
      if (
        target.neighborhood &&
        candidate.neighborhood &&
        target.neighborhood.toLowerCase().trim() === candidate.neighborhood.toLowerCase().trim()
      ) {
        similarityScore += 15;
        reasons.push(`Same neighborhood: ${target.neighborhood}`);
      }

      // Description trigram similarity
      const descSim = Number(candidate.desc_similarity || 0);
      if (descSim > 0.4) {
        similarityScore += 25;
        reasons.push(`High textual description overlap (${Math.round(descSim * 100)}% similarity)`);
      }

      // Check if different owner (potential unauthorized relisting)
      if (candidate.owner_id !== target.owner_id) {
        reasons.push('Listing published under a different user account');
      }

      if (similarityScore >= 75) {
        // Record into ai_duplicate_flags for human review
        await query(
          `INSERT INTO ai_duplicate_flags (property_id, matched_property_id, similarity_score, reasons, status)
           VALUES ($1, $2, $3, $4, 'PENDING_REVIEW')
           ON CONFLICT DO NOTHING`,
          [target.id, candidate.id, Math.min(100, similarityScore), JSON.stringify(reasons)]
        ).catch(() => {});

        return {
          isPotentialDuplicate: true,
          similarityScore: Math.min(100, similarityScore),
          matchedPropertyId: candidate.id,
          matchedPropertyTitle: candidate.title,
          matchedOwnerId: candidate.owner_id,
          reasons
        };
      }
    }

    return {
      isPotentialDuplicate: false,
      similarityScore: 0,
      reasons: []
    };
  }
}
