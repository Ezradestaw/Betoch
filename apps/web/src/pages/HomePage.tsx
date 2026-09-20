import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PropertyCard } from '../components/PropertyCard';
import { ADDIS_ABABA_SUBCITIES } from '@betoch/shared';
import {
  Search,
  ShieldCheck,
  Building2,
  FileCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Sparkles
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [subCity, setSubCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxRent, setMaxRent] = useState('');

  // Fetch featured verified listings
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => api.searchProperties({ limit: 6, verifiedOnly: true })
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subCity) params.append('subCity', subCity);
    if (propertyType) params.append('propertyType', propertyType);
    if (maxRent) params.append('maxRent', maxRent);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-brand-950 via-brand-900 to-slate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-gold-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethiopian Housing Proclamation No. 1320/2024 Compliant</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find a place that <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-200 to-gold-300">
              feels like home.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Verified properties, authenticated landlords, and transparent rental contracts in Addis Ababa. Zero ghost listings. Zero predatory broker fees.
          </p>

          {/* Prominent Search Card */}
          <div className="mt-10 max-w-4xl mx-auto bg-white rounded-2xl p-3 sm:p-4 shadow-2xl shadow-brand-950/50 text-slate-900 border border-white/10 text-left">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Sub-city Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Sub-City</label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Addis Ababa</option>
                  {ADDIS_ABABA_SUBCITIES.map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Any Type</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="VILLA">Villa</option>
                  <option value="CONDOMINIUM">Condominium</option>
                  <option value="STUDIO">Studio</option>
                  <option value="TOWNHOUSE">Townhouse</option>
                </select>
              </div>

              {/* Max Budget in ETB */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Max Rent (ETB)</label>
                <input
                  type="number"
                  placeholder="e.g. 35000"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Search CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Search className="w-4 h-4" />
                  Search Homes
                </button>
              </div>
            </form>
          </div>

          {/* Quick neighborhood tags */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Popular:</span>
            {['Bole Atlas', 'Kazanchis', 'Old Airport', 'CMC', 'Sarbet', 'Summit'].map((n) => (
              <button
                key={n}
                onClick={() => navigate(`/properties?neighborhood=${encodeURIComponent(n)}`)}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Safeguards Section */}
      <section id="trust-safeguards" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              The Betoch Trust Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Why Addis Ababa Chooses Betoch Over Street Brokers
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              We replaced informal street <em>delalas</em> with identity verification, title deed validation, and lawful rental contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Title Deed Verified</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Landlords submit official property documentation (Carta / Lease) verified by our team before receiving the Verified Property badge.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Fayda National ID</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Seamless identity verification using Ethiopia's Fayda Digital ID system ensures real humans and accountable landlords.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">2-Month Deposit Limit</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Strict adherence to Proclamation No. 1320/2024 protects tenants from illegal 6 to 12-month advance rent demands.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Telebirr & CBE Secure</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Cryptographically signed digital transactions with Telebirr and commercial banks. Transparent 10% platform fee vs 100% street broker fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Verified Marketplace</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Featured Properties in Addis Ababa</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Inspected residences ready for immediate move-in.</p>
            </div>
            <Link
              to="/properties"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
            >
              View all listings ({propertiesData?.pagination?.total || '6'})
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 bg-slate-200/60 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {propertiesData?.items?.map((property: any) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Simple & Transparent
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">How Betoch Works</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              From search to key handoff in four legally compliant steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-800 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/10">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">Discover Verified Homes</h4>
              <p className="text-xs text-slate-600 mt-2">
                Filter by sub-city, price in ETB, and required amenities with real photos and verified locations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-800 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/10">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">Submit Application</h4>
              <p className="text-xs text-slate-600 mt-2">
                Send your profile, move-in timeline, and introduction directly to the verified owner.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-800 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/10">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">In-App Chat & Agreement</h4>
              <p className="text-xs text-slate-600 mt-2">
                Message safely inside Betoch. Owner approves and generates legal rental agreement.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-800 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/10">
                4
              </div>
              <h4 className="text-sm font-bold text-slate-900">Move In With Peace of Mind</h4>
              <p className="text-xs text-slate-600 mt-2">
                Pay deposit securely via Telebirr. Receive official contract registered with Woreda Housing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Homeowner Callout Banner */}
      <section className="py-14 bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">For Homeowners & Landlords</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">Rent Your Property to Verified Tenants</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Eliminate delala broker harassment and phantom viewings. Betoch pre-screens tenant identities with Fayda ID, manages rental inquiries, and generates compliant rental contracts.
            </p>
          </div>
          <Link
            to="/owner/create-listing"
            className="px-6 py-3 rounded-xl bg-white text-brand-900 hover:bg-slate-100 text-xs font-bold shadow-lg transition-all shrink-0"
          >
            List Your Property Now
          </Link>
        </div>
      </section>
    </div>
  );
};
