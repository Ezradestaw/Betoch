// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — PROPERTY MATCHING SERVICE
// Transparent, deterministic preference matching based on stated user preferences
// ==============================================================================

import { query } from '../../../database/db.js';
import { PropertyMatchResult, MatchFactor } from '@betoch/shared';
import { UserPreferencesInput } from '@betoch/validation';

export class PropertyMatchingService {
  static async calculateMatch(
    propertyId: string,
    prefs: UserPreferencesInput
  ): Promise<PropertyMatchResult> {
    const propRes = await query(
      `SELECT p.id, p.title, p.monthly_rent, p.sub_city, p.bedrooms, p.bathrooms,
              p.property_type, p.furnished,
              (
                SELECT COALESCE(json_agg(pa.amenity_id), '[]'::json)
                FROM property_amenities pa
                WHERE pa.property_id = p.id
              ) AS amenities
       FROM properties p
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [propertyId]
    );

    if (propRes.rows.length === 0) {
      throw new Error('Property not found');
    }

    const prop = propRes.rows[0];
    const factors: MatchFactor[] = [];
    let totalWeight = 0;
    let weightedScore = 0;

    // 1. Budget Factor (Weight: 30)
    if (prefs.budget && prefs.budget > 0) {
      totalWeight += 30;
      const rent = Number(prop.monthly_rent);
      if (rent <= prefs.budget) {
        factors.push({
          factor: 'Budget',
          matched: true,
          score: 100,
          explanation: `Within your budget: ${rent.toLocaleString()} ETB/mo (max ${prefs.budget.toLocaleString()} ETB)`
        });
        weightedScore += 30 * 100;
      } else if (rent <= prefs.budget * 1.15) {
        const score = Math.round((1 - (rent - prefs.budget) / (prefs.budget * 0.15)) * 80);
        factors.push({
          factor: 'Budget',
          matched: false,
          score,
          explanation: `Slightly above your stated budget (${rent.toLocaleString()} ETB vs ${prefs.budget.toLocaleString()} ETB)`
        });
        weightedScore += 30 * (score / 100);
      } else {
        factors.push({
          factor: 'Budget',
          matched: false,
          score: 20,
          explanation: `Exceeds your budget by >15% (${rent.toLocaleString()} ETB/mo)`
        });
        weightedScore += 30 * 0.2;
      }
    }

    // 2. Location / Sub-city Factor (Weight: 25)
    if (prefs.subCity) {
      totalWeight += 25;
      const subCityMatch = prop.sub_city.toLowerCase() === prefs.subCity.toLowerCase();
      if (subCityMatch) {
        factors.push({
          factor: 'Location',
          matched: true,
          score: 100,
          explanation: `Located in your preferred area: ${prop.sub_city}`
        });
        weightedScore += 25 * 100;
      } else {
        factors.push({
          factor: 'Location',
          matched: false,
          score: 30,
          explanation: `Located in ${prop.sub_city} (preferred: ${prefs.subCity})`
        });
        weightedScore += 25 * 30;
      }
    }

    // 3. Bedrooms Factor (Weight: 20)
    if (prefs.bedrooms !== undefined) {
      totalWeight += 20;
      if (prop.bedrooms === prefs.bedrooms) {
        factors.push({
          factor: 'Bedrooms',
          matched: true,
          score: 100,
          explanation: `Exact match: ${prop.bedrooms} bedrooms`
        });
        weightedScore += 20 * 100;
      } else if (prop.bedrooms > prefs.bedrooms) {
        factors.push({
          factor: 'Bedrooms',
          matched: true,
          score: 90,
          explanation: `Provides extra rooms: ${prop.bedrooms} bedrooms (wanted ${prefs.bedrooms})`
        });
        weightedScore += 20 * 90;
      } else {
        factors.push({
          factor: 'Bedrooms',
          matched: false,
          score: 30,
          explanation: `Has ${prop.bedrooms} bedrooms (fewer than your desired ${prefs.bedrooms})`
        });
        weightedScore += 20 * 30;
      }
    }

    // 4. Furnished Factor (Weight: 10)
    if (prefs.furnished !== undefined) {
      totalWeight += 10;
      const matched = prop.furnished === prefs.furnished;
      factors.push({
        factor: 'Furnishing',
        matched,
        score: matched ? 100 : 20,
        explanation: matched
          ? prop.furnished
            ? 'Fully furnished as requested'
            : 'Unfurnished as requested'
          : prop.furnished
          ? 'Furnished (you indicated unfurnished preference)'
          : 'Unfurnished (you requested furnished)'
      });
      weightedScore += 10 * (matched ? 100 : 20);
    }

    // 5. Amenities Factor (Weight: 15)
    if (prefs.amenities && prefs.amenities.length > 0) {
      totalWeight += 15;
      const propAmenities: string[] = prop.amenities || [];
      const matchedAmenities = prefs.amenities.filter((a) => propAmenities.includes(a));
      const ratio = matchedAmenities.length / prefs.amenities.length;
      const score = Math.round(ratio * 100);

      factors.push({
        factor: 'Amenities',
        matched: score >= 70,
        score,
        explanation: `${matchedAmenities.length} of ${prefs.amenities.length} requested amenities included (${matchedAmenities.join(', ')})`
      });
      weightedScore += 15 * score;
    }

    // If no preferences were specified, return default baseline
    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 75;

    return {
      overallScore: Math.min(100, Math.max(10, overallScore)),
      summary: `Match based on your stated preferences (${overallScore}% alignment).`,
      factors
    };
  }
}
