-- ==============================================================================
-- BETOCH DATABASE MIGRATION: 004_fayda_identity_verification_schema.sql
-- Production-grade, privacy-preserving National ID & Fayda Verification schema
-- ==============================================================================

-- 1. Relax legacy manual document requirements to support digital eKYC / OIDC provider sessions
ALTER TABLE identity_verifications ALTER COLUMN id_type DROP NOT NULL;
ALTER TABLE identity_verifications ALTER COLUMN id_number_hash DROP NOT NULL;
ALTER TABLE identity_verifications ALTER COLUMN id_number_masked DROP NOT NULL;
ALTER TABLE identity_verifications ALTER COLUMN document_front_url DROP NOT NULL;

-- 2. Drop legacy status check constraints
ALTER TABLE identity_verifications DROP CONSTRAINT IF EXISTS identity_verifications_status_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_identity_status_check;

-- 3. Add normalized provider abstraction fields
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS provider VARCHAR(50) NOT NULL DEFAULT 'fayda';
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS provider_verification_id VARCHAR(255);
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50) NOT NULL DEFAULT 'IDENTITY';
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS failure_code VARCHAR(100);
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS failure_reason_safe TEXT;
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS session_nonce VARCHAR(128);
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS session_state VARCHAR(128);
ALTER TABLE identity_verifications ADD COLUMN IF NOT EXISTS verified_claims JSONB;

-- 4. Re-apply standardized verification state machine check constraints
ALTER TABLE identity_verifications ADD CONSTRAINT identity_verifications_status_check
    CHECK (status IN (
        'PENDING',
        'VERIFIED',
        'FAILED',
        'EXPIRED',
        'REVOKED',
        'CANCELLED',
        'APPROVED',      -- Legacy alias for VERIFIED
        'REJECTED',      -- Legacy alias for FAILED
        'REQUIRES_INFO'
    ));

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_identity_status_check
    CHECK (identity_status IN (
        'UNVERIFIED',
        'VERIFICATION_PENDING',
        'VERIFIED',
        'VERIFICATION_FAILED',
        'VERIFICATION_EXPIRED',
        'VERIFICATION_REVOKED',
        'PENDING',       -- Legacy alias for VERIFICATION_PENDING
        'REJECTED',      -- Legacy alias for VERIFICATION_FAILED
        'REQUIRES_INFO'
    ));

-- 5. Idempotency & Replay Protection Index
-- Ensures each provider callback / verification session can only be mapped once
CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_provider_session
    ON identity_verifications (provider, provider_verification_id)
    WHERE provider_verification_id IS NOT NULL;

-- 6. Performance indexes for session retrieval, expiration, and user status queries
CREATE INDEX IF NOT EXISTS idx_identity_verif_user_status ON identity_verifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_identity_verif_expires_at ON identity_verifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_identity_verif_state ON identity_verifications(session_state) WHERE session_state IS NOT NULL;
