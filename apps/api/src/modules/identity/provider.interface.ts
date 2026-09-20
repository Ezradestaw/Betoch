// ==============================================================================
// BETOCH IDENTITY VERIFICATION PROVIDER INTERFACE
// Modular, provider-independent identity verification contract
// ==============================================================================

export interface CreateVerificationSessionInput {
  userId: string;
  verificationType: 'IDENTITY' | 'OWNER_IDENTITY' | 'RENTER_IDENTITY';
  redirectUrl?: string;
  userMetadata?: {
    email?: string;
    phone?: string;
    role?: string;
  };
}

export interface VerificationSession {
  verificationReference: string;
  providerSessionId: string;
  redirectUrl: string;
  expiresAt: Date;
  nonce: string;
  state: string;
}

export interface VerifiedClaims {
  maskedFin?: string;
  fullName?: string;
  verifiedAt?: Date;
  providerMetadata?: Record<string, unknown>;
}

export interface VerificationStatusResult {
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  completedAt?: Date;
  failureCode?: string;
  failureReasonSafe?: string;
  verifiedClaims?: VerifiedClaims;
}

export interface VerifiedIdentityResult {
  verificationReference: string;
  providerVerificationId: string;
  status: 'VERIFIED' | 'FAILED';
  failureCode?: string;
  failureReasonSafe?: string;
  verifiedClaims?: VerifiedClaims;
}

export interface IdentityVerificationProvider {
  readonly providerName: string;

  /**
   * Initializes a verification session with the identity provider.
   */
  createVerificationSession(
    input: CreateVerificationSessionInput
  ): Promise<VerificationSession>;

  /**
   * Queries the provider for the current verification state.
   */
  getVerificationStatus(
    verificationReference: string
  ): Promise<VerificationStatusResult>;

  /**
   * Cryptographically validates and unpacks an inbound callback/webhook from the provider.
   */
  verifyCallback(
    request: unknown
  ): Promise<VerifiedIdentityResult>;

  /**
   * Cancels or aborts an active verification session.
   */
  cancelVerification?(
    verificationReference: string
  ): Promise<void>;
}
