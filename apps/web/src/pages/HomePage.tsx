// ==============================================================================
// BETOCH SMART HOME PAGE — REDESIGNED FOR EFFORTLESS USER CONVENIENCE
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PropertyCard, PropertyCardItem } from '../components/PropertyCard';
import { ADDIS_ABABA_SUBCITIES } from '@betoch/shared';
import {
  getRecentlyViewed,
  clearRecentlyViewed,
  getSavedSearchPreferences,
  saveSearchPreferences,
  clearSearchPreferences
} from '../utils/recentlyViewed';
import {
  Search,
  ShieldCheck,
  Building2,
  FileCheck,
  CreditCard,
  ArrowRight,
  MapPin,
  Sparkles,
  Heart,
  FileText,
  PlusCircle,
  History,
  X,
  Compass,
  CheckCircle,
  BadgePercent
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [subCity, setSubCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');

  // Local storage state for "Continue your search" & "Recently viewed"
  const [previousSearch, setPreviousSearch] = useState<Record<string, any> | null>(null);
  const [recentHomes, setRecentHomes] = useState<PropertyCardItem[]>([]);

  useEffect(() => {
    setPreviousSearch(getSavedSearchPreferences());
    setRecentHomes(getRecentlyViewed());
  }, []);

  // Fetch featured verified listings
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => api.searchProperties({ limit: 6, verifiedOnly: true })
  });

  // Fetch affordable listings (< 30,000 ETB)
  const { data: affordableData } = useQuery({
    queryKey: ['affordable-properties'],
    queryFn: () => api.searchProperties({ limit: 3, maxRent: 30000, sortBy: 'price_asc' })
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const searchPrefs: Record<string, any> = {};

    if (subCity) {
      params.append('subCity', subCity);
      searchPrefs.subCity = subCity;
    }
    if (propertyType) {
      params.append('propertyType', propertyType);
      searchPrefs.propertyType = propertyType;
    }
    if (minRent) {
      params.append('minRent', minRent);
      searchPrefs.minRent = minRent;
    }
    if (maxRent) {
      params.append('maxRent', maxRent);
      searchPrefs.maxRent = maxRent;
    }

    if (Object.keys(searchPrefs).length > 0) {
      saveSearchPreferences(searchPrefs);
    }

    navigate(`/properties?${params.toString()}`);
  };

  const handleResumeSearch = () => {
    if (!previousSearch) return;
    const params = new URLSearchParams();
    Object.entries(previousSearch).forEach(([k, v]) => {
      if (k !== 'savedAt' && v) params.append(k, String(v));
    });
    navigate(`/properties?${params.toString()}`);
  };

  const handleClearPreviousSearch = () => {
    clearSearchPreferences();
    setPreviousSearch(null);
  };

  const handleClearHistory = () => {
    clearRecentlyViewed();
    setRecentHomes([]);
  };

  const featuredItems: PropertyCardItem[] = featuredData?.items || [];
  const affordableItems: PropertyCardItem[] = affordableData?.items || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-brand-950 via-brand-900 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-gold-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Proclamation 1320 Trust Pill */}
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

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Verified properties, authenticated landlords, and transparent rental contracts in Addis Ababa. Zero ghost listings. Zero predatory broker fees.
          </p>

          {/* Primary Search Card */}
          <div className="mt-8 max-w-4xl mx-auto bg-white rounded-2xl p-4 shadow-2xl shadow-brand-950/50 text-slate-900 border border-white/10 text-left">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Location */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Where do you want to live?
                </label>
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  What type of home?
                </label>
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
                  <option value="ROOM">Room</option>
                </select>
              </div>

              {/* Budget Min - Max */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Monthly Budget (ETB)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minRent}
                    onChange={(e) => setMinRent(e.target.value)}
                    className="w-1/2 px-2.5 py-2.5 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-1/2 px-2.5 py-2.5 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Search CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Search Homes
                </button>
              </div>
            </form>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
            <Link
              to="/properties"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/10"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-300" />
              Find a home
            </Link>
            <Link
              to="/owner/create-listing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/10"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gold-300" />
              List my property
            </Link>
            <Link
              to="/renter/saved"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/10"
            >
              <Heart className="w-3.5 h-3.5 text-red-300" />
              Saved homes
            </Link>
            <Link
              to="/renter/applications"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/10"
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              My applications
            </Link>
          </div>
        </div>
      </div>

      {/* "CONTINUE YOUR SEARCH" BANNER (Section 3) */}
      {previousSearch && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 z-20 relative">
          <div className="bg-white rounded-2xl border border-brand-200/80 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700">
                <History className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                  Pick Up Where You Left Off
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  Continue your search:
                  <span className="font-semibold text-slate-600 ml-1">
                    {[
                      previousSearch.subCity,
                      previousSearch.propertyType,
                      previousSearch.maxRent ? `Under ${Number(previousSearch.maxRent).toLocaleString()} ETB` : ''
                    ].filter(Boolean).join(' • ')}
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResumeSearch}
                className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
              >
                Resume Search <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClearPreviousSearch}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPULAR LOCATIONS CHIPS */}
      <section className="py-8 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Explore Popular Addis Ababa Neighborhoods
            </h3>
            <Link to="/properties" className="text-xs font-semibold text-brand-700 hover:underline">
              All Sub-Cities →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Bole Atlas', subCity: 'Bole', tag: 'Expat & Dining Hub' },
              { name: 'Kazanchis', subCity: 'Kirkos', tag: 'Business District' },
              { name: 'Old Airport', subCity: 'Nifas Silk-Lafto', tag: 'Quiet & Green' },
              { name: 'CMC', subCity: 'Lemi Kura', tag: 'Spacious Compounds' },
              { name: 'Sarbet', subCity: 'Kirkos', tag: 'Central & Vibrant' },
              { name: 'Summit', subCity: 'Yeka', tag: 'Modern Residential' }
            ].map((loc) => (
              <button
                key={loc.name}
                onClick={() => navigate(`/properties?neighborhood=${encodeURIComponent(loc.name)}&subCity=${encodeURIComponent(loc.subCity)}`)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-brand-50/70 border border-slate-200 hover:border-brand-200 text-left transition-all group"
              >
                <span className="text-xs font-bold text-slate-900 group-hover:text-brand-900 block truncate">
                  {loc.name}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  {loc.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RECENTLY VIEWED (Section 10) */}
      {recentHomes.length > 0 && (
        <section className="py-12 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-700" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recently Viewed</h2>
              </div>
              <button
                onClick={handleClearHistory}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentHomes.slice(0, 4).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECOMMENDED & VERIFIED HOMES */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Verified Marketplace</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Recommended Verified Homes</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Inspected residences ready for immediate move-in.</p>
            </div>
            <Link
              to="/properties?verifiedOnly=true"
              className="mt-3 sm:mt-0 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
            >
              Browse all verified <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AFFORDABLE HOMES SECTION (< 30k ETB) */}
      {affordableItems.length > 0 && (
        <section className="py-12 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <BadgePercent className="w-4 h-4 text-emerald-600" />
                  Budget-Friendly Options
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Affordable Homes under 30,000 ETB</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Quality apartments and studios in accessible sub-cities.</p>
              </div>
              <Link
                to="/properties?maxRent=30000"
                className="mt-3 sm:mt-0 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
              >
                View all affordable <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {affordableItems.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TRUST & SAFETY SAFEGUARDS */}
      <section id="trust-safeguards" className="py-16 bg-slate-50 border-b border-slate-200">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Title Deed Verified</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Landlords submit official property documentation (Carta / Lease) verified by our team before receiving the Verified Property badge.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Fayda National ID</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Seamless identity verification using Ethiopia's Fayda Digital ID system ensures real humans and accountable landlords.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">2-Month Deposit Limit</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Strict adherence to Proclamation No. 1320/2024 protects tenants from illegal 6 to 12-month advance rent demands.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
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
    </div>
  );
};
