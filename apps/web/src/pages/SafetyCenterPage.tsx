// ==============================================================================
// BETOCH SAFETY CENTER
// Practical safety guide for physical inspections, fraud avoidance & reporting
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertOctagon,
  Eye,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  Lock,
  Flag,
  Calendar,
  Building
} from 'lucide-react';

export const SafetyCenterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Renter Protection & Anti-Fraud Center</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Stay Safe Before, During, <br className="hidden sm:inline" />
            and After Your Home Tour.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Finding a home in Addis Ababa should be exciting, not stressful. Follow these proven guidelines to inspect properties securely and avoid common rental traps.
          </p>
        </div>

        {/* 4 Golden Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center font-bold mb-4">
              1
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-2">Zero Advance Cash</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Never send private money transfers, "holding deposits", or inspection fees via Telebirr or CBE to an individual before entering the home.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-4">
              2
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-2">Inspect During Daylight</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Schedule viewing appointments between 9:00 AM and 5:00 PM so you can evaluate natural lighting, neighborhood activity, and safety.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-4">
              3
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-2">Bring a Friend or Colleague</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Always have a second pair of eyes when visiting a property. A companion helps inspect plumbing, doors, and evaluates whether the location fits your lifestyle.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4">
              4
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-2">Keep Records on Betoch</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Communicate using Betoch messaging and escrow so there is an immutable audit trail in the event of any tenancy disagreement or refund claim.
            </p>
          </div>
        </div>

        {/* Physical Inspection Checklist */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 mb-16 shadow-sm">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl font-black text-slate-900">
              The Addis Ababa 7-Point Inspection Checklist
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Take this checklist on your phone during your physical property tour:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                1. Water Supply & Reserve Tank
              </span>
              <p className="text-slate-500 pl-5">
                Turn on all taps and flush toilets. Ask the homeowner how many cubic meters the backup water tank (Rototank) holds and the neighborhood water schedule.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                2. Backup Electricity & Generator
              </span>
              <p className="text-slate-500 pl-5">
                Confirm whether the building has a working standby generator, whether it powers internal apartment outlets or only common corridors, and fuel sharing costs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                3. Physical Security & Locks
              </span>
              <p className="text-slate-500 pl-5">
                Examine main compound gates, security guard availability, exterior lighting, window grills (if ground floor), and cylinder deadbolts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                4. Utility Meter Separation
              </span>
              <p className="text-slate-500 pl-5">
                Ensure the apartment has its own dedicated prepaid electric meter card (ቆጣሪ) so you are not responsible for neighboring tenants' electricity bills.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                5. Road Access & Taxi/Ride Availability
              </span>
              <p className="text-slate-500 pl-5">
                Check whether Feres, RIDE, or local minibuses easily reach the gate, especially during rainy season cobblestone flooding.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                6. 2-Month Deposit Enforcement
              </span>
              <p className="text-slate-500 pl-5">
                By Ethiopian Proclamation No. 1320/2024, no homeowner may legally ask for more than 2 months of security deposit. If anyone demands 6 or 12 months in advance, report them immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency & Incident Reporting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-red-50/70 border border-red-200/80 rounded-3xl p-8">
            <div className="flex items-center gap-2 text-red-900 font-extrabold text-sm mb-3">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <span>Suspect Fraud or a Ghost Listing?</span>
            </div>
            <p className="text-xs text-red-800 leading-relaxed mb-6">
              Our Trust & Safety fraud monitoring team investigates all reported properties within 4 business hours. If an owner misrepresents amenities or demands illegal off-platform deposits, report them directly.
            </p>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Flag className="w-3.5 h-3.5" />
              Find Listing & Report
            </Link>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm mb-3">
                <PhoneCall className="w-5 h-5" />
                <span>Ethiopian Emergency Contacts</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Keep these local emergency numbers handy whenever visiting unfamiliar sub-cities:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Federal Police Emergency:</span>
                  <span className="text-emerald-400 font-bold">991</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Addis Ababa Fire & Rescue:</span>
                  <span className="text-emerald-400 font-bold">939</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Betoch Safety Support:</span>
                  <span className="text-emerald-400 font-bold">+251 11 812 0000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
