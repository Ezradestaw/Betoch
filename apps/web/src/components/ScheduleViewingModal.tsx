import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ScheduleViewingModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleViewingModal: React.FC<ScheduleViewingModalProps> = ({
  propertyId,
  propertyTitle,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [proposedDate, setProposedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<'MORNING_9_12' | 'AFTERNOON_12_3' | 'EVENING_3_6'>('AFTERNOON_12_3');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to schedule a property viewing.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createViewingRequest({
        propertyId,
        proposedDate,
        timeSlot,
        notes
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit viewing request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <Calendar className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Request Property Viewing</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Viewing Request Sent!</h3>
            <p className="text-xs text-slate-600">
              The homeowner has been notified with your preferred date and time slot. They will confirm the appointment shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-brand-700 text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred Time Window</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'MORNING_9_12', label: 'Morning', sub: '9 AM - 12 PM' },
                  { id: 'AFTERNOON_12_3', label: 'Afternoon', sub: '12 PM - 3 PM' },
                  { id: 'EVENING_3_6', label: 'Evening', sub: '3 PM - 6 PM' }
                ].map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setTimeSlot(slot.id as any)}
                    className={`p-2 rounded-xl text-center border transition ${
                      timeSlot === slot.id
                        ? 'bg-brand-50 border-brand-500 text-brand-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px]">{slot.label}</div>
                    <div className="text-[9px] text-slate-400">{slot.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Note to Homeowner (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special inquiries or arrival instructions..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Safety reminder: Always view properties in daylight and never send advance payments before in-person inspection.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-xs"
            >
              {submitting ? 'Submitting Request...' : 'Confirm Viewing Appointment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
