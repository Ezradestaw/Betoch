import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TrustBadge } from '../components/TrustBadge';
import { IdDocumentType } from '@betoch/shared';
import { ShieldCheck, CheckCircle2, Clock, Upload, AlertCircle, FileText, Lock } from 'lucide-react';

export const VerificationPortalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  const [idType, setIdType] = useState<IdDocumentType>(IdDocumentType.FAYDA_DIGITAL_ID);
  const [idNumber, setIdNumber] = useState('');
  const [documentFrontUrl, setDocumentFrontUrl] = useState('/uploads/verifications/sample_id_front.jpg');
  const [documentBackUrl, setDocumentBackUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: verifStatus, isLoading } = useQuery({
    queryKey: ['identity-status'],
    queryFn: () => api.getIdentityStatus()
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submitIdentityVerification(data),
    onSuccess: () => {
      setSuccess(true);
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['identity-status'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit verification.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    submitMutation.mutate({
      idType,
      idNumber,
      documentFrontUrl,
      documentBackUrl: documentBackUrl || undefined
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Trust & Identity Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Identity Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authenticate your identity using Ethiopia's Fayda Digital ID, Kebele card, or Passport.
          </p>
        </div>

        {/* Current Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block mb-1">Your Account Verification Status:</span>
            <div className="flex items-center gap-2">
              <TrustBadge type="identity" status={verifStatus?.status || 'UNVERIFIED'} size="lg" />
              {verifStatus?.maskedId && (
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  {verifStatus.maskedId}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500 max-w-xs">
            {verifStatus?.status === 'VERIFIED' ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> You have verified trust status on Betoch.
              </span>
            ) : verifStatus?.status === 'PENDING' ? (
              <span className="text-blue-700 font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4" /> Your documents are currently under administrative review.
              </span>
            ) : (
              <span>Verification unlocks the Verified Trust badge on your profile and listings.</span>
            )}
          </div>
        </div>

        {/* Submission Form (if not yet verified) */}
        {verifStatus?.status !== 'VERIFIED' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b">Submit Verification Documents</h2>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Documents submitted successfully! Our compliance officers will review them within 24 hours.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIdType(IdDocumentType.FAYDA_DIGITAL_ID)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      idType === IdDocumentType.FAYDA_DIGITAL_ID
                        ? 'border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-600/20 font-bold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="block font-bold">Fayda Digital ID</span>
                    <span className="text-[10px] text-slate-500">National ID (FIN)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIdType(IdDocumentType.KEBELE_ID)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      idType === IdDocumentType.KEBELE_ID
                        ? 'border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-600/20 font-bold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="block font-bold">Kebele Resident ID</span>
                    <span className="text-[10px] text-slate-500">Addis Ababa City ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIdType(IdDocumentType.PASSPORT)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      idType === IdDocumentType.PASSPORT
                        ? 'border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-600/20 font-bold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="block font-bold">Passport</span>
                    <span className="text-[10px] text-slate-500">Ethiopian / Int'l</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {idType === IdDocumentType.FAYDA_DIGITAL_ID ? 'Fayda Identification Number (FIN)' : 'ID / Passport Number'}
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={idType === IdDocumentType.FAYDA_DIGITAL_ID ? 'e.g. ET-FIN-1234-5678-9012' : 'e.g. 03/128942'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Your ID number is securely salted & hashed (SHA-256) and never displayed publicly.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Front Image URL / Path</label>
                <input
                  type="text"
                  required
                  value={documentFrontUrl}
                  onChange={(e) => setDocumentFrontUrl(e.target.value)}
                  placeholder="/uploads/verifications/sample_id_front.jpg"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Back Image URL (Optional)</label>
                <input
                  type="text"
                  value={documentBackUrl}
                  onChange={(e) => setDocumentBackUrl(e.target.value)}
                  placeholder="/uploads/verifications/sample_id_back.jpg"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-slate-700"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/20 transition-all disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Verification for Review'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
