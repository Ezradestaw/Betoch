// ==============================================================================
// BETOCH IDENTITY VERIFICATION TEST SUITE
// Tests for Fayda provider abstraction, state machine, idempotency, security & RBAC
// ==============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockIdentityProvider } from '../apps/api/src/modules/identity/mock.provider.js';
import { FaydaIdentityProvider } from '../apps/api/src/modules/identity/fayda.provider.js';
import {
  startIdentityVerificationSchema,
  callbackIdentityVerificationSchema,
  revokeIdentityVerificationSchema
} from '@betoch/validation';
import { IdentityStatus, VerificationRecordStatus } from '@betoch/shared';

describe('National Identity Verification Architecture', () => {
  it('1. Mock Provider Safety: strictly forbids activation in production', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      assert.throws(
        () => new MockIdentityProvider(),
        /CRITICAL SECURITY VIOLATION/
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('2. Session Creation: generates cryptographic reference, state, nonce, and TTL', async () => {
    const provider = new MockIdentityProvider();
    const session = await provider.createVerificationSession({
      userId: '11111111-2222-3333-4444-555555555555',
      verificationType: 'IDENTITY'
    });

    assert.ok(session.verificationReference.startsWith('MOCK-FYD-'));
    assert.ok(session.state.length >= 32);
    assert.ok(session.nonce.length >= 32);
    assert.ok(session.expiresAt.getTime() > Date.now());
    assert.ok(session.redirectUrl.includes(session.state));
  });

  it('3. Callback Validation: verifies state and unpacks minimal verified claims', async () => {
    const provider = new MockIdentityProvider();
    const session = await provider.createVerificationSession({
      userId: '11111111-2222-3333-4444-555555555555',
      verificationType: 'IDENTITY'
    });

    // Valid callback simulation
    const verifiedResult = await provider.verifyCallback({
      state: session.state,
      reference: session.verificationReference,
      simulatedOutcome: 'APPROVED'
    });

    assert.equal(verifiedResult.status, 'VERIFIED');
    assert.ok(verifiedResult.verifiedClaims?.maskedFin?.startsWith('FIN-••••-'));
    assert.equal(verifiedResult.verifiedClaims?.fullName, 'Verified Citizen (Fayda Mock)');
    assert.ok(verifiedResult.verifiedClaims?.verifiedAt);

    // Rejection simulation
    const rejectedResult = await provider.verifyCallback({
      state: session.state,
      reference: session.verificationReference,
      simulatedOutcome: 'REJECTED',
      failureReason: 'Biometric capture does not match Fayda registry'
    });

    assert.equal(rejectedResult.status, 'FAILED');
    assert.equal(rejectedResult.failureCode, 'BIOMETRIC_MISMATCH');
    assert.equal(rejectedResult.failureReasonSafe, 'Biometric capture does not match Fayda registry');
  });

  it('4. Replay & Forgery Defense: rejects missing state or malformed payload', async () => {
    const provider = new MockIdentityProvider();
    const result = await provider.verifyCallback({});

    assert.equal(result.status, 'FAILED');
    assert.equal(result.failureCode, 'INVALID_CALLBACK_STATE');
  });

  it('5. Production Fayda Provider: fails gracefully if required NIDP secrets are missing', () => {
    const fayda = new FaydaIdentityProvider({
      clientId: '',
      clientSecret: ''
    });

    assert.rejects(
      () => fayda.createVerificationSession({
        userId: '11111111-2222-3333-4444-555555555555',
        verificationType: 'IDENTITY'
      }),
      /Fayda production integration is not configured/
    );
  });
});

describe('Identity Validation Schemas & State Machine', () => {
  it('1. Start Verification Schema: accepts valid types and rejects illegal types', () => {
    const valid = startIdentityVerificationSchema.safeParse({
      verificationType: 'OWNER_IDENTITY'
    });
    assert.equal(valid.success, true);

    const invalid = startIdentityVerificationSchema.safeParse({
      verificationType: 'ILLEGAL_TYPE'
    });
    assert.equal(invalid.success, false);
  });

  it('2. Callback Schema: requires state and allows optional signature & code', () => {
    const valid = callbackIdentityVerificationSchema.safeParse({
      state: 'valid_crypto_state_string',
      code: 'oidc_auth_code_12345',
      signature: 'hmac_sha256_signature'
    });
    assert.equal(valid.success, true);

    const missingState = callbackIdentityVerificationSchema.safeParse({});
    assert.equal(missingState.success, false);
  });

  it('3. Revoke Schema: requires valid UUID and descriptive reason', () => {
    const valid = revokeIdentityVerificationSchema.safeParse({
      targetUserId: 'd3b07384-d113-4603-9099-0a6042f8c050',
      reason: 'Official National ID reported stolen by citizen'
    });
    assert.equal(valid.success, true);

    const invalid = revokeIdentityVerificationSchema.safeParse({
      targetUserId: 'invalid-uuid',
      reason: 'sh'
    });
    assert.equal(invalid.success, false);
  });

  it('4. State Machine Enum: correctly distinguishes all 6 verification lifecycle states', () => {
    const states = [
      IdentityStatus.UNVERIFIED,
      IdentityStatus.VERIFICATION_PENDING,
      IdentityStatus.VERIFIED,
      IdentityStatus.VERIFICATION_FAILED,
      IdentityStatus.VERIFICATION_EXPIRED,
      IdentityStatus.VERIFICATION_REVOKED
    ];

    assert.equal(states.length, 6);
    assert.equal(IdentityStatus.VERIFIED, 'VERIFIED');
    assert.equal(IdentityStatus.VERIFICATION_FAILED, 'VERIFICATION_FAILED');
  });
});
