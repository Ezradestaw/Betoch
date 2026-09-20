// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — OBSERVABILITY & METRICS SERVICE
// Tracks latency, tokens, cost estimates, errors, and user feedback
// ==============================================================================

import { query } from '../../../database/db.js';

export interface AIRequestRecord {
  feature: string;
  userId?: string;
  provider: string;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  estimatedCostUsd?: number;
  success: boolean;
  errorMessage?: string;
}

export interface AIFeedbackRecord {
  feature: string;
  resourceId?: string;
  userId?: string;
  rating: 'POSITIVE' | 'NEGATIVE';
  comment?: string;
}

export class AIObservabilityService {
  static async recordRequest(record: AIRequestRecord): Promise<void> {
    try {
      await query(
        `INSERT INTO ai_requests (feature, user_id, provider, model, latency_ms, tokens_used, estimated_cost_usd, success, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          record.feature,
          record.userId || null,
          record.provider,
          record.model,
          record.latencyMs,
          record.tokensUsed || 0,
          record.estimatedCostUsd || 0,
          record.success,
          record.errorMessage || null
        ]
      );
    } catch (err) {
      // Non-blocking logger
      console.error('[AI Observability] Failed to log AI request metrics:', err);
    }
  }

  static async recordFeedback(feedback: AIFeedbackRecord): Promise<void> {
    await query(
      `INSERT INTO ai_feedback (feature, resource_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        feedback.feature,
        feedback.resourceId || null,
        feedback.userId || null,
        feedback.rating,
        feedback.comment || null
      ]
    );
  }

  static async getMetrics(): Promise<any> {
    const totalRequestsRes = await query(`SELECT COUNT(*) AS total FROM ai_requests`);
    const avgLatencyRes = await query(`SELECT COALESCE(AVG(latency_ms), 0) AS avg_latency FROM ai_requests`);
    const failedRequestsRes = await query(`SELECT COUNT(*) AS failed FROM ai_requests WHERE success = false`);
    const totalTokensRes = await query(`SELECT COALESCE(SUM(tokens_used), 0) AS tokens FROM ai_requests`);
    const totalCostRes = await query(`SELECT COALESCE(SUM(estimated_cost_usd), 0) AS cost FROM ai_requests`);

    const topFeaturesRes = await query(
      `SELECT feature, COUNT(*) AS request_count, AVG(latency_ms) AS avg_latency
       FROM ai_requests
       GROUP BY feature
       ORDER BY request_count DESC
       LIMIT 8`
    );

    const feedbackRes = await query(
      `SELECT rating, COUNT(*) AS count FROM ai_feedback GROUP BY rating`
    );

    const duplicateAlertsRes = await query(
      `SELECT COUNT(*) AS count FROM ai_duplicate_flags WHERE status = 'PENDING_REVIEW'`
    );

    const riskSignalsRes = await query(
      `SELECT COUNT(*) AS count FROM ai_risk_signals WHERE status = 'DETECTED'`
    );

    return {
      totalRequests: parseInt(totalRequestsRes.rows[0].total, 10),
      averageLatencyMs: Math.round(Number(avgLatencyRes.rows[0].avg_latency)),
      failedRequests: parseInt(failedRequestsRes.rows[0].failed, 10),
      totalTokens: parseInt(totalTokensRes.rows[0].tokens, 10),
      totalCostUsd: Number(Number(totalCostRes.rows[0].cost).toFixed(4)),
      topFeatures: topFeaturesRes.rows.map((r) => ({
        feature: r.feature,
        requestCount: parseInt(r.request_count, 10),
        avgLatencyMs: Math.round(Number(r.avg_latency))
      })),
      feedbackBreakdown: feedbackRes.rows.reduce(
        (acc: any, row) => ({ ...acc, [row.rating]: parseInt(row.count, 10) }),
        { POSITIVE: 0, NEGATIVE: 0 }
      ),
      pendingDuplicateReviews: parseInt(duplicateAlertsRes.rows[0].count, 10),
      activeRiskSignals: parseInt(riskSignalsRes.rows[0].count, 10)
    };
  }
}
