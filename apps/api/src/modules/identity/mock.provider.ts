// ==============================================================================
// BETOCH MOCK IDENTITY PROVIDER
// Strictly for development, testing, and CI environments
// ==============================================================================

import crypto from 'crypto';
import {
  IdentityVerificationProvider,
  CreateVerificationSessionInput,
  VerificationSession,
  VerificationStatusResult,
  VerifiedIdentityResult
} from './provider.interface.js';

export class MockIdentityProvider implements IdentityVerificationProvider {
  readonly providerName = 'mock_fayda';
  private readonly secretKey: string;

  constructor() {
    // Hard fail if activated in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY VIOLATION: MockIdentityProvider cannot be activated in production environment.'
      );
    }
    this.secretKey = process.env.MOCK_FAYDA_SECRET || 'betoch_mock_fayda_internal_signing_key_2026';
  }

  async createVerificationSession(
    input: CreateVerificationSessionInput
  ): Promise<VerificationSession> {
    const reference = `MOCK-FYD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const providerSessionId = `sess_${crypto.randomUUID()}`;
    const nonce = crypto.randomBytes(24).toString('hex');
    const state = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    // Generate local simulation link for frontend development
    const redirectUrl = `/profile/verification?simulated_fayda_session=${providerSessionId}&state=${state}&ref=${reference}`;

    return {
      verificationReference: reference,
      providerSessionId,
      redirectUrl,
      expiresAt,
      nonce,
      state
    };
  }

  async getVerificationStatus(
    verificationReference: string
  ): Promise<VerificationStatusResult> {
    // In mock mode, status is queried from internal state
    return {
      status: 'PENDING'
    };
  }

  async verifyCallback(
    request: unknown
  ): Promise<VerifiedIdentityResult> {
    const payload = request as {
      state: string;
      reference?: string;
      signature?: string;
      simulatedOutcome?: 'APPROVED' | 'REJECTED' | 'EXPIRED';
      failureReason?: string;
    };

    if (!payload?.state) {
      return {
        verificationReference: payload?.reference || 'UNKNOWN',
        providerVerificationId: 'invalid_callback',
        status: 'FAILED',
        failureCode: 'INVALID_CALLBACK_STATE',
        failureReasonSafe: 'Invalid or missing verification callback parameters.'
      };
    }

    // Check if simulation specifies rejection
    if (payload.simulatedOutcome === 'REJECTED') {
      return {
        verificationReference: payload.reference || 'UNKNOWN',
        providerVerificationId: `mock_fail_${Date.now()}`,
        status: 'FAILED',
        failureCode: 'BIOMETRIC_MISMATCH',
        failureReasonSafe: payload.failureReason || 'Fayda biometric match could not be verified.'
      };
    }

    // Default simulation: Successful identity verification
    const simulatedFin = `FIN-••••-${Math.floor(1000 + Math.random() * 9000)}`;
    const verifiedResultId = `mock_tx_${crypto.randomBytes(8).toString('hex')}`;

    return {
      verificationReference: payload.reference || 'UNKNOWN',
      providerVerificationId: verifiedResultId,
      status: 'VERIFIED',
      verifiedClaims: {
        maskedFin: simulatedFin,
        fullName: 'Verified Citizen (Fayda Mock)',
        verifiedAt: new Date()
      }
    };
  }

  async cancelVerification?(verificationReference: string): Promise<void> {
    // No-op for mock provider
  }
}
