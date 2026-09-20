// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — FEATURE FLAGS SERVICE
// Dynamic runtime toggles without requiring system restart
// ==============================================================================

import { query } from '../../../database/db.js';
import { AIFeatureKey } from '@betoch/shared';

interface FlagCache {
  flags: Record<string, boolean>;
  lastFetched: number;
}

const cache: FlagCache = {
  flags: {},
  lastFetched: 0
};

const CACHE_TTL_MS = 30000; // 30 seconds in-memory cache

export class FeatureFlagsService {
  static async isFeatureEnabled(featureKey: AIFeatureKey | string): Promise<boolean> {
    const now = Date.now();
    if (now - cache.lastFetched > CACHE_TTL_MS || !(featureKey in cache.flags)) {
      await this.refreshCache();
    }
    return cache.flags[featureKey] ?? true;
  }

  static async toggleFeature(featureKey: AIFeatureKey | string, isEnabled: boolean): Promise<void> {
    await query(
      `INSERT INTO ai_feature_flags (feature_key, is_enabled, description, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (feature_key) DO UPDATE
       SET is_enabled = $2, updated_at = NOW()`,
      [featureKey, isEnabled, `Feature flag for ${featureKey}`]
    );

    cache.flags[featureKey] = isEnabled;
  }

  static async getAllFlags(): Promise<Array<{ featureKey: string; isEnabled: boolean; description: string; updatedAt: string }>> {
    const res = await query(`SELECT feature_key, is_enabled, description, updated_at FROM ai_feature_flags ORDER BY feature_key ASC`);
    const flags = res.rows.map((r) => ({
      featureKey: r.feature_key,
      isEnabled: r.is_enabled,
      description: r.description,
      updatedAt: r.updated_at
    }));

    // Update in-memory cache
    flags.forEach((f) => {
      cache.flags[f.featureKey] = f.isEnabled;
    });
    cache.lastFetched = Date.now();

    return flags;
  }

  private static async refreshCache(): Promise<void> {
    try {
      const res = await query(`SELECT feature_key, is_enabled FROM ai_feature_flags`);
      const newFlags: Record<string, boolean> = {};
      res.rows.forEach((row) => {
        newFlags[row.feature_key] = row.is_enabled;
      });
      cache.flags = newFlags;
      cache.lastFetched = Date.now();
    } catch {
      // If table query fails, default to true
    }
  }
}
