import React, { useState } from 'react';
import { api } from '../api/client';
import { X, Flag, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  propertyId?: string;
  reportedUserId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  propertyId,
  reportedUserId,
  isOpen,
  onClose
}) => {
  const [reason, setReason] = useState('FAKE_LISTING');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.submitReport({
        propertyId,
        reportedUserId,
        reason,
        description
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">Report Listing / Owner</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Betoch takes trust and safety seriously. All reports are investigated immediately by our moderation team.
        </p>

        {success ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold text-center border border-emerald-200">
            Thank you. Your report has been submitted for review.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="FAKE_LISTING">Fake or Non-Existent Listing (Ghost listing)</option>
                <option value="SCAM_ATTEMPT">Scam attempt or asking for illegal upfront fees</option>
                <option value="INCORRECT_INFORMATION">Incorrect pricing, photos or location</option>
                <option value="SUSPICIOUS_OWNER">Suspicious owner behavior or impersonation</option>
                <option value="OTHER">Other violation of platform rules</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Details & Evidence</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what occurred..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
