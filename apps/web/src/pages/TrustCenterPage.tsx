// ==============================================================================
// BETOCH TRUST CENTER
// Complete transparency on verification, legal compliance, and platform trust
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Scale,
  Users,
  Search,
  Lock,
  ArrowRight
} from 'lucide-react';

export const TrustCenterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Trust & Compliance Standard</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Rent with Confidence. <br className="hidden sm:inline" />
            Backed by Law & Verification.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Betoch is built from the ground up to eradicate rental fraud, deceptive deposits, and ghost listings in Addis Ababa through Fayda national ID checks, Carta deed verification, and strict enforcement of Federal Proclamation No. 1320/2024.
          </p>
        </div>

        {/* 3 Pillars of Trust */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">1. Fayda National ID</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every homeowner and tenant is verified against their official Ethiopian Fayda identification. This eliminates anonymous scammers and holds every platform member accountable.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-6">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">2. Carta Title Deed Check</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verified Listings require landlords to provide certified property title deeds (ካርታ). We cross-reference ownership names so you never pay someone who doesn't own the home.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-6">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">3. Proclamation 1320/2024</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our automated system strictly enforces Ethiopian rental law: security deposits are legally capped at a maximum of 2 months' rent, and leases adhere to standard municipality terms.
            </p>
          </div>
        </div>

        {/* Verification Matrix: What Betoch Verifies vs. What You Should Inspect */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-16">
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900">
              Clear Transparency Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              We believe in honest transparency. Here is what Betoch legally and digitally verifies, and what we urge every renter to physically inspect before move-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* What Betoch Verifies */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <span>What Betoch Verifies (100% Platform Guarantee)</span>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Landlord Identity & Fayda Number:</strong> We confirm the owner's legal name, photo, and national registry record.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Carta Title Ownership:</strong> The person listing the property matches the official Carta document or has a verified legal power of attorney (ውክልና).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Proclamation Compliance:</strong> Rent, 2-month deposit ceilings, and standardized lease agreements meet Ethiopian federal law.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Escrow Protection:</strong> Payments are tracked and recorded with digital receipts for Woreda registration.
                  </div>
                </div>
              </div>
            </div>

            {/* What You Should Inspect */}
            <div className="p-6 sm:p-8 space-y-4 bg-slate-50/30">
              <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm mb-4">
                <AlertTriangle className="w-5 h-5" />
                <span>What You Should Inspect In Person</span>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">1</span>
                  <div>
                    <strong>Water Pressure & Rototank Backup:</strong> Check plumbing fixtures, reservoir capacity, and the local water schedule.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">2</span>
                  <div>
                    <strong>Backup Power & Generator:</strong> Verify whether standby generator switches automatically during Addis power outages.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">3</span>
                  <div>
                    <strong>Neighborhood Access & Road Quality:</strong> Check road accessibility, cobblestone conditions, and evening lighting.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">4</span>
                  <div>
                    <strong>Prepaid Electric Meter (Electric Prepaid Card):</strong> Ensure no inherited outstanding electricity debt remains on the meter.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black">Ready to verify your profile?</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Fayda-verified members get priority tour bookings, direct landlord communication, and faster lease processing.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/safety"
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Safety Guidelines
            </Link>
            <Link
              to="/profile/verification"
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <span>Verify Fayda ID</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
