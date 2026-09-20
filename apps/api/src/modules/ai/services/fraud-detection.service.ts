// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — FRAUD & RISK SCORING SERVICE
// Multi-signal heuristic and pattern risk evaluation for safety moderation
// ==============================================================================

import { query } from '../../../database/db.js';
import { RiskSignalReport, AIRiskLevel } from '@betoch/shared';

export class FraudDetectionService {
  static async evaluateUserRisk(userId: string): Promise<RiskSignalReport> {
    const signals: Array<{ type: string; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];
    let riskScore = 10; // baseline low

    // 1. Check reports against user
    const reportsRes = await query(
      `SELECT COUNT(*) FROM reports WHERE reported_user_id = $1 AND status != 'DISMISSED'`,
      [userId]
    );
    const reportCount = parseInt(reportsRes.rows[0].count, 10);
    if (reportCount >= 3) {
      riskScore += 45;
      signals.push({
        type: 'MULTIPLE_REPORTS',
        description: `User has been flagged in ${reportCount} active moderation reports.`,
        severity: 'HIGH'
      });
    } else if (reportCount >= 1) {
      riskScore += 20;
      signals.push({
        type: 'USER_REPORTED',
        description: `User has 1 prior moderation report on record.`,
        severity: 'MEDIUM'
      });
    }

    // 2. Check listing velocity (rapid publishing)
    const velocityRes = await query(
      `SELECT COUNT(*) FROM properties 
       WHERE owner_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    );
    const recentListings = parseInt(velocityRes.rows[0].count, 10);
    if (recentListings >= 4) {
      riskScore += 30;
      signals.push({
        type: 'RAPID_LISTING_VELOCITY',
        description: `Published ${recentListings} properties in under 24 hours.`,
        severity: 'MEDIUM'
      });
    }

    // 3. Verification status check
    const profileRes = await query(
      `SELECT identity_status FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    const idStatus = profileRes.rows[0]?.identity_status;
    if (idStatus === 'REJECTED') {
      riskScore += 25;
      signals.push({
        type: 'FAILED_VERIFICATION',
        description: 'Previous Fayda National ID verification was rejected by moderators.',
        severity: 'MEDIUM'
      });
    }

    const overallRiskScore = Math.min(100, riskScore);
    let riskLevel = AIRiskLevel.LOW;
    if (overallRiskScore >= 70) riskLevel = AIRiskLevel.CRITICAL;
    else if (overallRiskScore >= 50) riskLevel = AIRiskLevel.HIGH;
    else if (overallRiskScore >= 30) riskLevel = AIRiskLevel.MEDIUM;

    const requiresHumanReview = overallRiskScore >= 50;

    if (requiresHumanReview) {
      await query(
        `INSERT INTO ai_risk_signals (entity_type, entity_id, risk_score, risk_level, signals, status)
         VALUES ('USER', $1, $2, $3, $4, 'DETECTED')
         ON CONFLICT DO NOTHING`,
        [userId, overallRiskScore, riskLevel, JSON.stringify(signals)]
      ).catch(() => {});
    }

    return {
      overallRiskScore,
      riskLevel,
      requiresHumanReview,
      signals
    };
  }

  static async evaluatePropertyRisk(propertyId: string): Promise<RiskSignalReport> {
    const signals: Array<{ type: string; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];
    let riskScore = 5;

    const propRes = await query(
      `SELECT p.id, p.owner_id, p.monthly_rent, p.deposit_amount, p.sub_city, p.property_type,
              p.verification_status, up.identity_status
       FROM properties p
       JOIN user_profiles up ON up.user_id = p.owner_id
       WHERE p.id = $1`,
      [propertyId]
    );

    if (propRes.rows.length === 0) {
      return { overallRiskScore: 0, riskLevel: AIRiskLevel.LOW, requiresHumanReview: false, signals: [] };
    }

    const prop = propRes.rows[0];

    // 1. Proclamation 1320/2024 Deposit Cap Check
    const maxDeposit = Number(prop.monthly_rent) * 2;
    if (Number(prop.deposit_amount) > maxDeposit) {
      riskScore += 35;
      signals.push({
        type: 'EXCESSIVE_DEPOSIT_DEMAND',
        description: `Deposit (${Number(prop.deposit_amount)} ETB) exceeds the 2-month legal limit under Proclamation 1320/2024.`,
        severity: 'HIGH'
      });
    }

    // 2. Unusually low price (rental bait scam check)
    const medianRes = await query(
      `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY monthly_rent) AS median_rent
       FROM properties
       WHERE LOWER(sub_city) = LOWER($1) AND property_type = $2 AND listing_status = 'PUBLISHED'`,
      [prop.sub_city, prop.property_type]
    );

    const medianRent = Number(medianRes.rows[0]?.median_rent || 0);
    if (medianRent > 0 && Number(prop.monthly_rent) < medianRent * 0.4) {
      riskScore += 40;
      signals.push({
        type: 'ANOMALOUS_LOW_PRICE',
        description: `Monthly rent (${prop.monthly_rent} ETB) is over 60% below the neighborhood median (${medianRent} ETB), a frequent indicator of advance-fee baiting.`,
        severity: 'HIGH'
      });
    }

    // 3. Unverified Owner with Multiple Listings
    if (prop.identity_status !== 'VERIFIED') {
      riskScore += 15;
      signals.push({
        type: 'UNVERIFIED_OWNER',
        description: 'Listing published by an unverified account without municipal title deed.',
        severity: 'LOW'
      });
    }

    const overallRiskScore = Math.min(100, riskScore);
    let riskLevel = AIRiskLevel.LOW;
    if (overallRiskScore >= 70) riskLevel = AIRiskLevel.CRITICAL;
    else if (overallRiskScore >= 50) riskLevel = AIRiskLevel.HIGH;
    else if (overallRiskScore >= 30) riskLevel = AIRiskLevel.MEDIUM;

    const requiresHumanReview = overallRiskScore >= 50;

    if (requiresHumanReview) {
      await query(
        `INSERT INTO ai_risk_signals (entity_type, entity_id, risk_score, risk_level, signals, status)
         VALUES ('PROPERTY', $1, $2, $3, $4, 'DETECTED')
         ON CONFLICT DO NOTHING`,
        [propertyId, overallRiskScore, riskLevel, JSON.stringify(signals)]
      ).catch(() => {});
    }

    return {
      overallRiskScore,
      riskLevel,
      requiresHumanReview,
      signals
    };
  }
}
