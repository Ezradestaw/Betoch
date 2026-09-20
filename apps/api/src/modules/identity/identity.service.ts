// ==============================================================================
// BETOCH IDENTITY VERIFICATION SERVICE
// Core orchestration service with provider abstraction, atomic state machine,
// idempotency protection, and redacted structured logging
// ==============================================================================

import crypto from 'crypto';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';
import {
  IdentityVerificationProvider,
  CreateVerificationSessionInput,
  VerificationSession,
  VerifiedIdentityResult
} from './provider.interface.js';
import { MockIdentityProvider } from './mock.provider.js';
import { FaydaIdentityProvider } from './fayda.provider.js';
import {
  IdentityStatus,
  VerificationRecordStatus,
  IdentityVerificationStatusResponse,
  VerificationSessionResponse
} from '@betoch/shared';

// Redacted Structured Logger
function logIdentityEvent(
  eventType: string,
  details: {
    userId?: string;
    verificationId?: string;
    provider?: string;
    status?: string;
    failureCode?: string;
  }
) {
  const payload = {
    timestamp: new Date().toISOString(),
    event: eventType,
    userId: details.userId,
    verificationId: details.verificationId,
    provider: details.provider,
    status: details.status,
    failureCode: details.failureCode
  };
  console.log(`[IDENTITY_AUDIT] ${JSON.stringify(payload)}`);
}

export class IdentityVerificationService {
  private provider: IdentityVerificationProvider;

  constructor(provider?: IdentityVerificationProvider) {
    if (provider) {
      this.provider = provider;
    } else {
      const selected = (process.env.IDENTITY_PROVIDER || 'mock').toLowerCase();
      if (selected === 'fayda') {
        this.provider = new FaydaIdentityProvider();
      } else {
        this.provider = new MockIdentityProvider();
      }
    }
  }

  getProvider(): IdentityVerificationProvider {
    return this.provider;
  }

  /**
   * Step 1 — Initiates a new identity verification session
   */
  async startVerification(
    userId: string,
    input: { verificationType?: 'IDENTITY' | 'OWNER_IDENTITY' | 'RENTER_IDENTITY'; redirectUrl?: string },
    context: { ip?: string; userAgent?: string }
  ): Promise<VerificationSessionResponse> {
    // 1. Check current user identity status
    const profileRes = await query(
      `SELECT identity_status FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    const currentStatus = profileRes.rows[0]?.identity_status;

    if (currentStatus === IdentityStatus.VERIFIED) {
      throw {
        statusCode: 400,
        code: 'IDENTITY_ALREADY_VERIFIED',
        message: 'Your identity has already been verified and is in good standing.'
      };
    }

    // 2. Rate limiting / active session check (prevent excessive attempts: max 10 per day)
    const recentAttemptsRes = await query(
      `SELECT COUNT(*) AS count FROM identity_verifications
       WHERE user_id = $1 AND started_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    );
    if (parseInt(recentAttemptsRes.rows[0]?.count || '0', 10) >= 10) {
      throw {
        statusCode: 429,
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Maximum verification attempts exceeded for today. Please try again tomorrow.'
      };
    }

    // 3. Check for existing unexpired pending session
    const existingPendingRes = await query(
      `SELECT id, provider, provider_verification_id, expires_at, session_state
       FROM identity_verifications
       WHERE user_id = $1 AND status = 'PENDING' AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    // Cancel any stale pending sessions
    if (existingPendingRes.rows.length > 0) {
      await query(
        `UPDATE identity_verifications SET status = 'CANCELLED', updated_at = NOW()
         WHERE user_id = $1 AND status = 'PENDING'`,
        [userId]
      );
    }

    // 4. Delegate to provider to create official session
    const verificationType = input.verificationType || 'IDENTITY';
    const session: VerificationSession = await this.provider.createVerificationSession({
      userId,
      verificationType,
      redirectUrl: input.redirectUrl
    });

    // 5. Store session in atomic transaction
    let verificationRecordId: string;
    await withTransaction(async (client) => {
      const insertRes = await client.query(
        `INSERT INTO identity_verifications (
          user_id, provider, provider_verification_id, verification_type,
          status, started_at, expires_at, session_nonce, session_state
        ) VALUES ($1, $2, $3, $4, 'PENDING', NOW(), $5, $6, $7)
        RETURNING id`,
        [
          userId,
          this.provider.providerName,
          session.providerSessionId,
          verificationType,
          session.expiresAt,
          session.nonce,
          session.state
        ]
      );
      verificationRecordId = insertRes.rows[0].id;

      await client.query(
        `UPDATE user_profiles
         SET identity_status = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [IdentityStatus.VERIFICATION_PENDING, userId]
      );
    });

    // 6. Redacted structured logging & audit trail
    logIdentityEvent('identity_verification_started', {
      userId,
      verificationId: verificationRecordId!,
      provider: this.provider.providerName,
      status: 'PENDING'
    });

    await logAuditEvent({
      actorId: userId,
      action: 'IDENTITY_VERIFICATION_STARTED',
      resourceType: 'identity_verifications',
      resourceId: verificationRecordId!,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      metadata: {
        provider: this.provider.providerName,
        verificationType
      }
    });

    return {
      sessionId: session.providerSessionId,
      verificationReference: session.verificationReference,
      provider: this.provider.providerName,
      redirectUrl: session.redirectUrl,
      expiresAt: session.expiresAt.toISOString()
    };
  }

  /**
   * Step 2 — Query current verification status for authenticated user
   */
  async getVerificationStatus(userId: string): Promise<IdentityVerificationStatusResponse> {
    const profileRes = await query(
      `SELECT identity_status FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    let identityStatus = (profileRes.rows[0]?.identity_status as IdentityStatus) || IdentityStatus.UNVERIFIED;

    const verifRes = await query(
      `SELECT id, provider, provider_verification_id, status, started_at, completed_at,
              expires_at, failure_code, failure_reason_safe, verified_claims
       FROM identity_verifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (verifRes.rows.length === 0) {
      return {
        status: identityStatus,
        canRetry: true
      };
    }

    const row = verifRes.rows[0];

    // Check if pending verification has expired
    if (row.status === 'PENDING' && row.expires_at && new Date(row.expires_at) < new Date()) {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE identity_verifications SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
          [row.id]
        );
        await client.query(
          `UPDATE user_profiles SET identity_status = $1, updated_at = NOW() WHERE user_id = $2`,
          [IdentityStatus.VERIFICATION_EXPIRED, userId]
        );
      });
      identityStatus = IdentityStatus.VERIFICATION_EXPIRED;
      row.status = 'EXPIRED';
    }

    const maskedRef = row.verified_claims?.maskedFin
      ? row.verified_claims.maskedFin
      : row.provider_verification_id
      ? `FYD-••••-${row.provider_verification_id.slice(-4)}`
      : undefined;

    return {
      status: identityStatus,
      provider: row.provider,
      verifiedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
      maskedReference: maskedRef,
      failureCode: row.failure_code,
      failureReasonSafe: row.failure_reason_safe,
      canRetry: identityStatus !== IdentityStatus.VERIFIED && identityStatus !== IdentityStatus.VERIFICATION_PENDING
    };
  }

  /**
   * Step 3 — Secure Callback/Webhook processing with idempotency & replay protection
   */
  async handleCallback(
    payload: unknown,
    context: { ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; status: string; message: string }> {
    const raw = payload as { state?: string; reference?: string; code?: string };
    const state = raw?.state;

    if (!state) {
      throw {
        statusCode: 400,
        code: 'INVALID_CALLBACK',
        message: 'State parameter missing from verification callback.'
      };
    }

    // Lookup matching session
    const sessionRes = await query(
      `SELECT id, user_id, provider, status, expires_at, provider_verification_id
       FROM identity_verifications
       WHERE session_state = $1
       LIMIT 1`,
      [state]
    );

    if (sessionRes.rows.length === 0) {
      throw {
        statusCode: 404,
        code: 'SESSION_NOT_FOUND',
        message: 'No active verification session matches the provided callback state.'
      };
    }

    const session = sessionRes.rows[0];

    // Idempotency: If already completed, safely return existing result without duplicate action
    if (session.status === 'VERIFIED') {
      return {
        success: true,
        status: 'VERIFIED',
        message: 'Identity verification was previously completed successfully.'
      };
    }

    // Call provider to cryptographically verify payload
    const result: VerifiedIdentityResult = await this.provider.verifyCallback(payload);

    const isSuccess = result.status === 'VERIFIED';
    const newRecordStatus: VerificationRecordStatus = isSuccess
      ? VerificationRecordStatus.VERIFIED
      : VerificationRecordStatus.FAILED;

    const newProfileStatus: IdentityStatus = isSuccess
      ? IdentityStatus.VERIFIED
      : IdentityStatus.VERIFICATION_FAILED;

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE identity_verifications
         SET status = $1,
             provider_verification_id = COALESCE($2, provider_verification_id),
             completed_at = NOW(),
             failure_code = $3,
             failure_reason_safe = $4,
             verified_claims = $5,
             updated_at = NOW()
         WHERE id = $6`,
        [
          newRecordStatus,
          result.providerVerificationId,
          result.failureCode || null,
          result.failureReasonSafe || null,
          result.verifiedClaims ? JSON.stringify(result.verifiedClaims) : null,
          session.id
        ]
      );

      await client.query(
        `UPDATE user_profiles
         SET identity_status = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [newProfileStatus, session.user_id]
      );

      // In-app notification to user
      const notifTitle = isSuccess ? 'Identity Verified ✓' : 'Identity Verification Unsuccessful';
      const notifMsg = isSuccess
        ? 'Your Ethiopian Fayda Digital ID has been successfully verified. You now hold the Verified Trust badge on Betoch.'
        : `We could not verify your identity: ${result.failureReasonSafe || 'Please review your details and try again.'}`;

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES ($1, $2, $3, $4, '/profile/verification')`,
        [session.user_id, notifTitle, notifMsg, isSuccess ? 'IDENTITY_VERIFIED' : 'IDENTITY_FAILED']
      );
    });

    // Redacted structured logging
    logIdentityEvent(isSuccess ? 'identity_verification_completed' : 'identity_verification_failed', {
      userId: session.user_id,
      verificationId: session.id,
      provider: session.provider,
      status: newRecordStatus,
      failureCode: result.failureCode
    });

    await logAuditEvent({
      actorId: session.user_id,
      action: isSuccess ? 'IDENTITY_VERIFICATION_COMPLETED' : 'IDENTITY_VERIFICATION_FAILED',
      resourceType: 'identity_verifications',
      resourceId: session.id,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      metadata: {
        provider: session.provider,
        status: newRecordStatus,
        failureCode: result.failureCode
      }
    });

    return {
      success: isSuccess,
      status: newProfileStatus,
      message: isSuccess
        ? 'Identity verified successfully.'
        : (result.failureReasonSafe || 'Verification failed. Please retry.')
    };
  }

  /**
   * Step 4 — Retry verification after failure or expiration
   */
  async retryVerification(
    userId: string,
    context: { ip?: string; userAgent?: string }
  ): Promise<VerificationSessionResponse> {
    return this.startVerification(userId, {}, context);
  }

  /**
   * Step 5 — Admin Revocation of verification
   */
  async revokeVerification(
    adminId: string,
    targetUserId: string,
    reason: string,
    context: { ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; message: string }> {
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE identity_verifications
         SET status = 'REVOKED',
             failure_code = 'ADMINISTRATIVE_REVOCATION',
             failure_reason_safe = $1,
             updated_at = NOW()
         WHERE user_id = $2 AND status = 'VERIFIED'`,
        [reason, targetUserId]
      );

      await client.query(
        `UPDATE user_profiles
         SET identity_status = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [IdentityStatus.VERIFICATION_REVOKED, targetUserId]
      );

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES ($1, 'Verification Status Revoked', $2, 'IDENTITY_REVOKED', '/profile/verification')`,
        [targetUserId, `Your identity verification status was revoked: ${reason}`]
      );
    });

    logIdentityEvent('identity_verification_revoked', {
      userId: targetUserId,
      status: 'REVOKED'
    });

    await logAuditEvent({
      actorId: adminId,
      action: 'IDENTITY_VERIFICATION_REVOKED',
      resourceType: 'identity_verifications',
      resourceId: targetUserId,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      metadata: { targetUserId, reason }
    });

    return {
      success: true,
      message: 'Verification status successfully revoked.'
    };
  }
}

export const identityVerificationService = new IdentityVerificationService();
