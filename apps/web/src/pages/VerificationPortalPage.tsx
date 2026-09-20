// ==============================================================================
// BETOCH FAYDA NATIONAL IDENTITY VERIFICATION PORTAL
// Production-grade, privacy-preserving verification experience for renters & owners
// ==============================================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Eye,
  FileCheck,
  Building,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const VerificationPortalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { language, t } = useLanguage();

  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    state: string;
    verificationReference: string;
    provider: string;
  } | null>(null);

  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Query verification status
  const { data: verifStatus, isLoading, refetch } = useQuery({
    queryKey: ['national-identity-status'],
    queryFn: () => api.getNationalIdentityStatus(),
    refetchInterval: (query) => {
      // Auto-poll every 4s if session is pending
      const status = query.state.data?.status;
      return status === 'VERIFICATION_PENDING' || status === 'PENDING' ? 4000 : false;
    }
  });

  // Start verification mutation
  const startMutation = useMutation({
    mutationFn: () => api.startIdentityVerification({
      verificationType: user?.role === 'OWNER' ? 'OWNER_IDENTITY' : 'RENTER_IDENTITY'
    }),
    onSuccess: (res: any) => {
      setErrorMsg(null);
      const data = res.data || res;
      // Extract state from redirectUrl if mock/dev
      let state = '';
      try {
        const urlObj = new URL(data.redirectUrl, window.location.origin);
        state = urlObj.searchParams.get('state') || '';
      } catch {
        state = data.sessionId || '';
      }

      setActiveSession({
        sessionId: data.sessionId,
        state,
        verificationReference: data.verificationReference,
        provider: data.provider
      });

      queryClient.invalidateQueries({ queryKey: ['national-identity-status'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to start verification session.');
    }
  });

  // Retry verification mutation
  const retryMutation = useMutation({
    mutationFn: () => api.retryIdentityVerification(),
    onSuccess: (res: any) => {
      setErrorMsg(null);
      const data = res.data || res;
      let state = '';
      try {
        const urlObj = new URL(data.redirectUrl, window.location.origin);
        state = urlObj.searchParams.get('state') || '';
      } catch {
        state = data.sessionId || '';
      }

      setActiveSession({
        sessionId: data.sessionId,
        state,
        verificationReference: data.verificationReference,
        provider: data.provider
      });

      queryClient.invalidateQueries({ queryKey: ['national-identity-status'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to retry verification session.');
    }
  });

  // Mock simulation mutation (Development only)
  const simulateMutation = useMutation({
    mutationFn: ({ state, outcome, failureReason }: { state: string; outcome?: 'APPROVED' | 'REJECTED'; failureReason?: string }) =>
      api.simulateMockVerification({ state, outcome, failureReason }),
    onSuccess: () => {
      setIsSimulating(false);
      setActiveSession(null);
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['national-identity-status'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Simulation failed.');
    }
  });

  const handleStart = () => {
    startMutation.mutate();
  };

  const handleRetry = () => {
    retryMutation.mutate();
  };

  const currentStatus = verifStatus?.status || 'UNVERIFIED';
  const isVerified = currentStatus === 'VERIFIED';
  const isPending = currentStatus === 'VERIFICATION_PENDING' || currentStatus === 'PENDING';
  const isFailed = currentStatus === 'VERIFICATION_FAILED' || currentStatus === 'FAILED' || currentStatus === 'REJECTED';
  const isExpired = currentStatus === 'VERIFICATION_EXPIRED' || currentStatus === 'EXPIRED';
  const isRevoked = currentStatus === 'VERIFICATION_REVOKED' || currentStatus === 'REVOKED';

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Fayda National Digital ID (የኢትዮጵያ ብሔራዊ ዲጂታል መታወቂያ)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            National Identity Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Verify your official Ethiopian Fayda identification to build community trust, prevent rental fraud, and unlock certified tenancy rights under Federal Proclamation No. 1320/2024.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Status Card Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8">
          {isLoading ? (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-700" />
              <span>Checking verification status with secure vault...</span>
            </div>
          ) : isVerified ? (
            /* STATE: VERIFIED */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">Identity Verified ✓</h2>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Fayda Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Your identity has been authenticated against the National ID registry.
                    </p>
                    {verifStatus?.verifiedAt && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Verified on: {new Date(verifStatus.verifiedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Privacy Masked Reference
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg inline-block mt-1">
                    {verifStatus?.maskedReference || 'FIN-••••-VERIFIED'}
                  </span>
                </div>
              </div>

              {/* Unlocked Privileges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                  <FileCheck className="w-5 h-5 text-emerald-700 mb-2" />
                  <h4 className="font-bold text-slate-900">Direct Applications</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Submit binding applications directly to homeowners.</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                  <Building className="w-5 h-5 text-emerald-700 mb-2" />
                  <h4 className="font-bold text-slate-900">Legal Lease Contracts</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Eligible for digital contracts under Proclamation 1320/2024.</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 mb-2" />
                  <h4 className="font-bold text-slate-900">Verified Trust Badge</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Visible to other verified users for safety and speed.</p>
                </div>
              </div>
            </div>
          ) : isPending ? (
            /* STATE: PENDING */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Clock className="w-7 h-7 animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Verification in Progress</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      We are waiting for the identity verification service to complete your verification session.
                    </p>
                    {verifStatus?.expiresAt && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Session expires at: {new Date(verifStatus.expiresAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Check Status
                  </button>
                </div>
              </div>

              {/* Dev Simulation Bar (Localhost) */}
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-brand-900 block flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-700" />
                    Interactive Fayda eKYC Simulator (Dev Mode)
                  </span>
                  <span className="text-[11px] text-brand-700">
                    Simulate the citizen eKYC biometric verification callback without external hardware.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      simulateMutation.mutate({
                        state: activeSession?.state || 'sess_active',
                        outcome: 'APPROVED'
                      })
                    }
                    disabled={simulateMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Simulate Approve
                  </button>
                  <button
                    onClick={() =>
                      simulateMutation.mutate({
                        state: activeSession?.state || 'sess_active',
                        outcome: 'REJECTED',
                        failureReason: 'Simulated biometric mismatch during test'
                      })
                    }
                    disabled={simulateMutation.isPending}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs"
                  >
                    Simulate Reject
                  </button>
                </div>
              </div>
            </div>
          ) : isFailed || isExpired || isRevoked ? (
            /* STATE: FAILED / EXPIRED / REVOKED */
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {isRevoked
                      ? 'Verification Status Revoked'
                      : isExpired
                      ? 'Verification Session Expired'
                      : "We couldn't verify your identity"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {verifStatus?.failureReasonSafe ||
                      'The verification session was not completed successfully. Please review the requirements and try again.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleRetry}
                  disabled={retryMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  {retryMutation.isPending ? 'Starting Session...' : 'Try Again'}
                </button>
              </div>
            </div>
          ) : (
            /* STATE: UNVERIFIED */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-700 block mb-1">Status: UNVERIFIED</span>
                  <h2 className="text-lg font-black text-slate-900">Identity Verification Required</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-lg">
                    Verify your identity to help keep Betoch safe for renters and property owners.
                  </p>
                </div>

                <button
                  onClick={handleStart}
                  disabled={startMutation.isPending}
                  className="px-6 py-3 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{startMutation.isPending ? 'Starting Session...' : 'Verify My Identity'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy by Design & Transparency Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Privacy-Preserving Verification
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Betoch adheres to strict data minimization principles. We do not store unmasked National ID numbers or biometric photographs on our web servers. Verification records are cryptographically hashed using SHA-256 for audit integrity.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-600" />
              Who Sees Your Identity?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your sensitive credentials are never exposed publicly or shared with other renters. Verified property owners only see your verified badge and legal full name when you voluntarily submit a rental application.
            </p>
          </div>
        </div>

        {/* Role-Specific Requirements Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 mb-4">
            Why Betoch Requires Fayda Verification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <Users className="w-4 h-4 text-emerald-700" />
                For Prospective Renters
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-slate-500">
                <li>Submit verified rental applications to landlords</li>
                <li>Execute Proclamation 1320/2024 standardized lease contracts</li>
                <li>Escrow dispute protection on security deposits</li>
                <li>Direct messaging with verified property owners</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <Building className="w-4 h-4 text-brand-700" />
                For Homeowners & Landlords
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-slate-500">
                <li>Publish verified rental listings across Addis Ababa</li>
                <li>Receive pre-screened tenant applications</li>
                <li>Automated Woreda lease registration numbers</li>
                <li>Collect rental payments and deposits via Telebirr escrow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
