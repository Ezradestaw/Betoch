// ==============================================================================
// BETOCH APPLICATION TIMELINE COMPONENT
// Visual 5-stage rental application progress tracker
// ==============================================================================

import React from 'react';
import { Check, Clock, X, AlertCircle, FileCheck, Key } from 'lucide-react';

interface ApplicationTimelineProps {
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  submittedAt: string;
  updatedAt?: string;
  hasContract?: boolean;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  status,
  submittedAt,
  updatedAt,
  hasContract = false
}) => {
  // Compute stage states based on application status
  const stages = [
    {
      label: 'Submitted',
      desc: 'Application received',
      isCompleted: true,
      isCurrent: status === 'SUBMITTED'
    },
    {
      label: 'Owner Review',
      desc: 'Owner reviewing dossier',
      isCompleted: status !== 'SUBMITTED' && status !== 'WITHDRAWN',
      isCurrent: status === 'UNDER_REVIEW'
    },
    {
      label: 'Decision',
      desc: status === 'ACCEPTED' ? 'Accepted by owner' : status === 'REJECTED' ? 'Application declined' : 'Pending decision',
      isCompleted: status === 'ACCEPTED' || status === 'REJECTED',
      isCurrent: status === 'UNDER_REVIEW',
      isRejected: status === 'REJECTED'
    },
    {
      label: 'Lease Agreement',
      desc: hasContract ? 'Contract registered' : 'Standard lease signing',
      isCompleted: hasContract,
      isCurrent: status === 'ACCEPTED' && !hasContract
    },
    {
      label: 'Key Handover',
      desc: 'Deposit in escrow & move-in',
      isCompleted: false,
      isCurrent: hasContract
    }
  ];

  return (
    <div className="py-4 border-t border-slate-100">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
        Application Progress Timeline
      </div>

      <div className="relative flex items-center justify-between">
        {/* Connecting progress line */}
        <div className="absolute left-0 top-3.5 h-0.5 w-full bg-slate-200 -z-0"></div>

        {stages.map((stage, idx) => {
          let badgeBg = 'bg-slate-100 text-slate-400 border-slate-200';
          let icon = <span className="text-[10px] font-bold">{idx + 1}</span>;

          if (stage.isRejected) {
            badgeBg = 'bg-red-500 text-white border-red-600';
            icon = <X className="w-3.5 h-3.5 stroke-[2.5]" />;
          } else if (stage.isCompleted) {
            badgeBg = 'bg-emerald-600 text-white border-emerald-700';
            icon = <Check className="w-3.5 h-3.5 stroke-[2.5]" />;
          } else if (stage.isCurrent) {
            badgeBg = 'bg-brand-700 text-white border-brand-800 ring-2 ring-brand-300';
            icon = <Clock className="w-3.5 h-3.5 animate-spin" />;
          }

          return (
            <div key={stage.label} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center shadow-xs transition-colors ${badgeBg}`}
              >
                {icon}
              </div>
              <span className={`text-[11px] mt-1.5 font-bold ${stage.isCurrent || stage.isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                {stage.label}
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block max-w-[80px] leading-tight">
                {stage.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
