// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — LISTING QUALITY ANALYZER
// Evaluates listing completeness and guides owners on high-converting listings
// ==============================================================================

import { AnalyzeQualityInput } from '@betoch/validation';
import { ListingQualityScore } from '@betoch/shared';

export class ListingQualityService {
  static analyzeQuality(input: AnalyzeQualityInput): ListingQualityScore {
    let score = 0;
    const missingItems: string[] = [];
    const suggestions: string[] = [];
    const strengths: string[] = [];

    // 1. Title Quality (10 pts)
    if (input.title && input.title.trim().length >= 15) {
      score += 10;
      strengths.push('Descriptive and clear title');
    } else {
      missingItems.push('Detailed listing title (at least 15 characters)');
      suggestions.push('Add a title mentioning bedroom count, property type, and neighborhood (e.g. "Modern 2-Bedroom Apartment in Bole")');
    }

    // 2. Description Depth (20 pts)
    if (input.description && input.description.trim().length >= 80) {
      score += 20;
      strengths.push('Comprehensive written property description');
    } else if (input.description && input.description.trim().length >= 30) {
      score += 10;
      suggestions.push('Expand your description to include layout details, nearby transit, and lease expectations.');
    } else {
      missingItems.push('Detailed property description');
      suggestions.push('Write at least 2-3 sentences explaining the living spaces, kitchen, and neighborhood advantages.');
    }

    // 3. Photo Coverage (25 pts)
    const photoCount = input.imageUrls ? input.imageUrls.length : 0;
    if (photoCount >= 4) {
      score += 25;
      strengths.push(`Rich visual gallery with ${photoCount} photos`);
    } else if (photoCount >= 2) {
      score += 15;
      suggestions.push('Upload at least 4 photos covering living room, bedroom, kitchen, and exterior.');
    } else if (photoCount === 1) {
      score += 8;
      missingItems.push('Additional interior and exterior photos');
      suggestions.push('Listings with 4+ photos receive up to 3x more renter inquiries.');
    } else {
      missingItems.push('Property photos');
      suggestions.push('Upload high quality photos of every major room.');
    }

    // 4. Floor Space (15 pts)
    if (input.sizeSqm && input.sizeSqm > 0) {
      score += 15;
      strengths.push(`Precise floor space specified (${input.sizeSqm} m²)`);
    } else {
      missingItems.push('Floor space (square meters)');
      suggestions.push('Specifying square footage helps tenants evaluate furniture suitability.');
    }

    // 5. Amenities Catalog (15 pts)
    const amenityCount = input.amenityIds ? input.amenityIds.length : 0;
    if (amenityCount >= 3) {
      score += 15;
      strengths.push(`${amenityCount} building and utility amenities highlighted`);
    } else if (amenityCount > 0) {
      score += 8;
      suggestions.push('Check off key amenities like Backup Water Tank, Generator, or Parking.');
    } else {
      missingItems.push('Amenities selection');
      suggestions.push('Select utilities and building amenities to stand out in search filters.');
    }

    // 6. Pricing & Proclamation 1320/2024 Terms (15 pts)
    if (input.monthlyRent && input.monthlyRent > 0) {
      if (input.depositAmount !== undefined) {
        const maxDeposit = input.monthlyRent * 2;
        if (input.depositAmount <= maxDeposit) {
          score += 15;
          strengths.push('Compliant with Ethiopian Proclamation 1320/2024 deposit rules');
        } else {
          score += 5;
          suggestions.push('Security deposit exceeds 2-month legal limit under Proclamation 1320/2024.');
        }
      } else {
        score += 10;
        suggestions.push('Specify the security deposit requirement.');
      }
    } else {
      missingItems.push('Monthly rent');
    }

    let grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' = 'POOR';
    if (score >= 85) grade = 'EXCELLENT';
    else if (score >= 70) grade = 'GOOD';
    else if (score >= 50) grade = 'NEEDS_IMPROVEMENT';

    return {
      score: Math.min(100, score),
      grade,
      missingItems,
      suggestions,
      strengths
    };
  }
}
