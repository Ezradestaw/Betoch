import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PropertyCard, PropertyCardItem } from '../components/PropertyCard';
import { PreferenceMatchModal } from '../components/PreferenceMatchModal';
import { PropertyComparisonModal } from '../components/PropertyComparisonModal';
import { ADDIS_ABABA_SUBCITIES, AMENITIES_CATALOG, PropertyComparisonResult } from '@betoch/shared';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Building,
  ShieldCheck,
  Sparkles,
  Scale,
  X,
  ArrowRight
} from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [subCity, setSubCity] = useState(searchParams.get('subCity') || '');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [furnished, setFurnished] = useState(searchParams.get('furnished') === 'true');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verifiedOnly') === 'true');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // AI Intelligence Layer States
  const [nlQuery, setNlQuery] = useState('');
  const [isNlSearching, setIsNlSearching] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  // Property Comparison State
  const [compareList, setCompareList] = useState<PropertyCardItem[]>([]);
  const [comparisonResult, setComparisonResult] = useState<PropertyComparisonResult | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isComparingLoading, setIsComparingLoading] = useState(false);

  // Preference Match State
  const [matchingProperty, setMatchingProperty] = useState<PropertyCardItem | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  // Sync state to URL params
  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (query) params.query = query;
    if (subCity) params.subCity = subCity;
    if (neighborhood) params.neighborhood = neighborhood;
    if (propertyType) params.propertyType = propertyType;
    if (minRent) params.minRent = minRent;
    if (maxRent) params.maxRent = maxRent;
    if (bedrooms) params.bedrooms = bedrooms;
    if (furnished) params.furnished = 'true';
    if (verifiedOnly) params.verifiedOnly = 'true';
    if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(',');
    if (sortBy !== 'newest') params.sortBy = sortBy;
    if (page > 1) params.page = String(page);

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSubCity('');
    setNeighborhood('');
    setPropertyType('');
    setMinRent('');
    setMaxRent('');
    setBedrooms('');
    setFurnished(false);
    setVerifiedOnly(false);
    setSelectedAmenities([]);
    setSortBy('newest');
    setPage(1);
    setSearchParams({});
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNLSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlQuery.trim()) return;

    setIsNlSearching(true);
    try {
      const res = await api.searchNaturalLanguage(nlQuery.trim());
      setAiInterpretation(res.interpretationSummary);

      const f = res.structuredFilters;
      if (f.subCity) setSubCity(f.subCity);
      if (f.propertyType) setPropertyType(f.propertyType);
      if (f.bedrooms !== undefined) setBedrooms(String(f.bedrooms));
      if (f.maxRent !== undefined) setMaxRent(String(f.maxRent));
      if (f.minRent !== undefined) setMinRent(String(f.minRent));
      if (f.furnished !== undefined) setFurnished(f.furnished);
      if (f.amenities) setSelectedAmenities(f.amenities.split(','));

      setPage(1);
    } catch (err) {
      console.error('AI Natural language search failed', err);
    } finally {
      setIsNlSearching(false);
    }
  };

  const handleToggleCompare = (property: PropertyCardItem) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === property.id);
      if (exists) {
        return prev.filter((p) => p.id !== property.id);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 properties at a time.');
        return prev;
      }
      return [...prev, property];
    });
  };

  const handleRunComparison = async () => {
    if (compareList.length < 2) return;
    setIsComparingLoading(true);
    try {
      const res = await api.compareProperties(compareList.map((p) => p.id));
      setComparisonResult(res);
      setIsCompareModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Comparison failed.');
    } finally {
      setIsComparingLoading(false);
    }
  };

  const handleCheckMatch = (property: PropertyCardItem) => {
    setMatchingProperty(property);
    setIsMatchModalOpen(true);
  };

  // Fetch properties query
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'properties',
      query,
      subCity,
      neighborhood,
      propertyType,
      minRent,
      maxRent,
      bedrooms,
      furnished,
      verifiedOnly,
      selectedAmenities.join(','),
      sortBy,
      page
    ],
    queryFn: () =>
      api.searchProperties({
        query: query || undefined,
        subCity: subCity || undefined,
        neighborhood: neighborhood || undefined,
        propertyType: propertyType || undefined,
        minRent: minRent ? Number(minRent) : undefined,
        maxRent: maxRent ? Number(maxRent) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        furnished: furnished ? 'true' : undefined,
        verifiedOnly: verifiedOnly ? 'true' : undefined,
        amenities: selectedAmenities.length ? selectedAmenities.join(',') : undefined,
        sortBy,
        page,
        limit: 12
      })
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* AI Natural Language Search Box */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-4 sm:p-5 mb-6 text-white shadow-md border border-brand-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gold-400/20 text-gold-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wide">AI Smart Search</h3>
                <p className="text-[11px] text-slate-300">Search naturally in English (e.g. "2-bed in Bole under 35k with generator")</p>
              </div>
            </div>

            {aiInterpretation && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] text-gold-300 border border-gold-400/30">
                <span>{aiInterpretation}</span>
                <button
                  onClick={() => setAiInterpretation(null)}
                  className="p-0.5 hover:text-white"
                  title="Clear AI filter banner"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleNLSearch} className="flex gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="Tell Betoch AI what you're looking for..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:bg-white/20"
            />
            <button
              type="submit"
              disabled={isNlSearching || !nlQuery.trim()}
              className="px-4 py-2.5 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isNlSearching ? 'Analyzing...' : 'AI Search'}</span>
            </button>
          </form>

          {/* Prompt chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px]">
            <span className="text-slate-400 self-center">Try:</span>
            {[
              '2-bedroom in Bole under 45k with generator',
              'Furnished apartment in Kazanchis',
              'Villa with backup water tank under 60k',
              'Studio under 20k'
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNlQuery(chip);
                  api.searchNaturalLanguage(chip).then((res) => {
                    setAiInterpretation(res.interpretationSummary);
                    const f = res.structuredFilters;
                    if (f.subCity) setSubCity(f.subCity);
                    if (f.propertyType) setPropertyType(f.propertyType);
                    if (f.bedrooms !== undefined) setBedrooms(String(f.bedrooms));
                    if (f.maxRent !== undefined) setMaxRent(String(f.maxRent));
                    if (f.furnished !== undefined) setFurnished(f.furnished);
                    if (f.amenities) setSelectedAmenities(f.amenities.split(','));
                    setPage(1);
                  });
                }}
                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Regular Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Search by title, neighborhood (e.g. Bole Atlas, Kazanchis, CMC)..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); applyFilters(); }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="newest">Sort: Newest Listed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="size_desc">Largest Area (m²)</option>
              </select>

              <button
                onClick={applyFilters}
                className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm transition-all shrink-0"
              >
                Apply Filters
              </button>

              <button
                onClick={handleResetFilters}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Sidebar Filters + Property Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filter Panel */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  Filter Homes
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-brand-700 font-semibold hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Sub-City Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Addis Ababa Sub-City</label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Sub-Cities</option>
                  {ADDIS_ABABA_SUBCITIES.map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Any Type</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="VILLA">Villa</option>
                  <option value="CONDOMINIUM">Condominium</option>
                  <option value="STUDIO">Studio</option>
                  <option value="TOWNHOUSE">Townhouse</option>
                </select>
              </div>

              {/* Monthly Rent Range in ETB */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Rent (ETB)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min ETB"
                    value={minRent}
                    onChange={(e) => setMinRent(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="number"
                    placeholder="Max ETB"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Bedrooms Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bedrooms</label>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {['', '1', '2', '3', '4'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBedrooms(b)}
                      className={`py-1.5 font-medium rounded-lg border transition-all text-center ${
                        bedrooms === b
                          ? 'bg-brand-700 text-white border-brand-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {b ? `${b}+` : 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles: Furnished & Verified Only */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Listings Only
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={furnished}
                    onChange={(e) => setFurnished(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Furnished Only</span>
                </label>
              </div>

              {/* Amenities Checklist */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2">Required Amenities</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {AMENITIES_CATALOG.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(a.id)}
                        onChange={() => toggleAmenity(a.id)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={applyFilters}
                className="w-full py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                Update Search Results
              </button>
            </div>
          </div>

          {/* Property Grid Results */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">
                Showing {data?.pagination?.total || 0} properties in Addis Ababa
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200/80 animate-pulse"></div>
                ))}
              </div>
            ) : data?.items?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No properties found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  No properties matched your exact criteria. Try increasing your maximum rent or selecting another sub-city.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-semibold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data?.items?.map((p: any) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    isCompareSelected={compareList.some((c) => c.id === p.id)}
                    onToggleCompare={handleToggleCompare}
                    onCheckMatch={handleCheckMatch}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Property Comparison Bottom Bar */}
        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-bold">{compareList.length} of 4 selected for comparison</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunComparison}
                disabled={compareList.length < 2 || isComparingLoading}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isComparingLoading ? 'Comparing...' : 'Compare Properties'}</span>
              </button>

              <button
                onClick={() => setCompareList([])}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                title="Clear comparison"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Preference Match Modal */}
        {matchingProperty && (
          <PreferenceMatchModal
            propertyId={matchingProperty.id}
            propertyTitle={matchingProperty.title}
            isOpen={isMatchModalOpen}
            onClose={() => {
              setIsMatchModalOpen(false);
              setMatchingProperty(null);
            }}
          />
        )}

        {/* Side-by-Side Comparison Modal */}
        <PropertyComparisonModal
          comparison={comparisonResult}
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
        />
      </div>
    </div>
  );
};
