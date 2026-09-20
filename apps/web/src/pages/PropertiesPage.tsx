// ==============================================================================
// BETOCH PROPERTY SEARCH & DISCOVERY HUB
// Split Map + List View, Mobile Filter Drawer, Saved Searches, and AI Assist
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PropertyCard, PropertyCardItem } from '../components/PropertyCard';
import { FilterDrawer } from '../components/FilterDrawer';
import { InteractiveMap } from '../components/InteractiveMap';
import { PreferenceMatchModal } from '../components/PreferenceMatchModal';
import { PropertyComparisonModal } from '../components/PropertyComparisonModal';
import { useAuth } from '../context/AuthContext';
import { saveSearchPreferences } from '../utils/recentlyViewed';
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
  MapPin,
  Bookmark,
  Map,
  List,
  Columns2,
  Check,
  ArrowRight
} from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, openAuthModal } = useAuth();

  // Filters state
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [subCity, setSubCity] = useState(searchParams.get('subCity') || '');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [bathrooms, setBathrooms] = useState(searchParams.get('bathrooms') || '');
  const [furnished, setFurnished] = useState(searchParams.get('furnished') === 'true');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verifiedOnly') === 'true');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // View Mode: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Saved Search Modal
  const [isSaveSearchModalOpen, setIsSaveSearchModalOpen] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [saveSearchSuccess, setSaveSearchSuccess] = useState(false);

  // AI Intelligence Layer States
  const [nlQuery, setNlQuery] = useState('');
  const [isNlSearching, setIsNlSearching] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  // Undo Toast State
  const [undoToast, setUndoToast] = useState<{ propertyId: string; title: string } | null>(null);

  // Comparison & Preference Match State
  const [compareList, setCompareList] = useState<PropertyCardItem[]>([]);
  const [comparisonResult, setComparisonResult] = useState<PropertyComparisonResult | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isComparingLoading, setIsComparingLoading] = useState(false);
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
    if (bathrooms) params.bathrooms = bathrooms;
    if (furnished) params.furnished = 'true';
    if (verifiedOnly) params.verifiedOnly = 'true';
    if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(',');
    if (sortBy !== 'newest') params.sortBy = sortBy;
    if (page > 1) params.page = String(page);

    // Save preferences locally for "Continue your search"
    saveSearchPreferences({ subCity, neighborhood, propertyType, minRent, maxRent, bedrooms });

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
    setBathrooms('');
    setFurnished(false);
    setVerifiedOnly(false);
    setSelectedAmenities([]);
    setSortBy('newest');
    setPage(1);
    setAiInterpretation(null);
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

  // Run property query
  const queryParams = {
    query: searchParams.get('query') || undefined,
    subCity: searchParams.get('subCity') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
    propertyType: searchParams.get('propertyType') || undefined,
    minRent: searchParams.get('minRent') ? parseInt(searchParams.get('minRent')!, 10) : undefined,
    maxRent: searchParams.get('maxRent') ? parseInt(searchParams.get('maxRent')!, 10) : undefined,
    bedrooms: searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!, 10) : undefined,
    furnished: searchParams.get('furnished') === 'true' ? true : undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true' ? true : undefined,
    amenities: searchParams.get('amenities') || undefined,
    sortBy,
    page,
    limit: 12
  };

  const { data, isLoading } = useQuery({
    queryKey: ['properties-search', queryParams],
    queryFn: () => api.searchProperties(queryParams)
  });

  const properties: PropertyCardItem[] = data?.items || [];

  // Active filter count
  const activeFiltersCount = [
    subCity,
    neighborhood,
    propertyType,
    minRent,
    maxRent,
    bedrooms,
    bathrooms,
    furnished,
    verifiedOnly,
    ...selectedAmenities
  ].filter(Boolean).length;

  const handleSaveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!savedSearchName.trim()) return;

    try {
      await api.createSavedSearch({
        name: savedSearchName.trim(),
        filters: queryParams,
        notifyEmail: true,
        notifyInApp: true
      });
      setSaveSearchSuccess(true);
      setTimeout(() => {
        setIsSaveSearchModalOpen(false);
        setSaveSearchSuccess(false);
        setSavedSearchName('');
      }, 1500);
    } catch (err) {
      console.error('Failed to save search', err);
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
    } catch (err) {
      console.error('Comparison error', err);
    } finally {
      setIsComparingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Quick Action Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Addis Ababa Rentals</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Browse Available Homes</h1>
            <p className="text-xs text-slate-500 mt-1">
              Verified residential listings with transparent prices and Proclamation 1320 deposit compliance.
            </p>
          </div>

          {/* View Mode Switcher & Saved Search CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSaveSearchModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-brand-300 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Bookmark className="w-3.5 h-3.5 text-brand-700" />
              <span>Save Search</span>
            </button>

            {/* Desktop View Switcher */}
            <div className="hidden lg:flex items-center bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Split Map + List"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="List Only"
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Map Only"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>

            {/* Mobile View Switcher */}
            <div className="flex lg:hidden items-center bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  viewMode !== 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Natural Language Search Bar */}
        <div className="bg-gradient-to-r from-brand-950 to-slate-900 rounded-2xl p-4 mb-5 text-white shadow-md">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gold-400 text-slate-950 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wide">AI Smart Search</h3>
                <p className="text-[11px] text-slate-300">Type what you want naturally (e.g. "2-bed in Bole under 35k with generator")</p>
              </div>
            </div>

            {aiInterpretation && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] text-gold-300 border border-gold-400/30">
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
              placeholder="e.g. 3 bedroom furnished villa in CMC with parking..."
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:bg-white/20"
            />
            <button
              type="submit"
              disabled={isNlSearching || !nlQuery.trim()}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isNlSearching ? 'Parsing...' : 'AI Search'}</span>
            </button>
          </form>
        </div>

        {/* Regular Search + Quick Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search title, neighborhood (Bole Atlas, Kazanchis, CMC)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Drawer Trigger */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 bg-slate-50 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-700" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-700 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                applyFilters();
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-brand-500"
            >
              <option value="newest">Newest Listed</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="size_desc">Largest Floor Space</option>
            </select>

            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              Search
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Active Filters:</span>
            {subCity && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-semibold text-[11px]">
                {subCity}
                <button onClick={() => { setSubCity(''); applyFilters(); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {neighborhood && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-semibold text-[11px]">
                {neighborhood}
                <button onClick={() => { setNeighborhood(''); applyFilters(); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {propertyType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-semibold text-[11px]">
                {propertyType}
                <button onClick={() => { setPropertyType(''); applyFilters(); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {maxRent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-semibold text-[11px]">
                Max {Number(maxRent).toLocaleString()} ETB
                <button onClick={() => { setMaxRent(''); applyFilters(); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {bedrooms && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-semibold text-[11px]">
                {bedrooms}+ Beds
                <button onClick={() => { setBedrooms(''); applyFilters(); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {verifiedOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                Verified Carta
                <button onClick={() => { setVerifiedOnly(false); applyFilters(); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {furnished && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-semibold text-[11px]">
                Furnished
                <button onClick={() => { setFurnished(false); applyFilters(); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-brand-700 font-bold hover:underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}

        {/* RESULTS & MAP LAYOUT */}
        {viewMode === 'map' ? (
          <div className="h-[600px] w-full">
            <InteractiveMap properties={properties} />
          </div>
        ) : viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left List (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{data?.pagination?.total || properties.length} properties found</span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No properties match your filters</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Try clearing or expanding your price range or sub-city selection.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      isCompareSelected={compareList.some((c) => c.id === p.id)}
                      onToggleCompare={handleToggleCompare}
                      onCheckMatch={(prop) => {
                        setMatchingProperty(prop);
                        setIsMatchModalOpen(true);
                      }}
                      onFavoriteChange={(id, isFav) => {
                        if (!isFav) {
                          setUndoToast({ propertyId: id, title: p.title });
                          setTimeout(() => setUndoToast(null), 5000);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Map (5 Cols, Sticky) */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="sticky top-20 h-[calc(100vh-6rem)]">
                <InteractiveMap properties={properties} />
              </div>
            </div>
          </div>
        ) : (
          /* List Only View (Full Width) */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{data?.pagination?.total || properties.length} properties found</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {properties.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    isCompareSelected={compareList.some((c) => c.id === p.id)}
                    onToggleCompare={handleToggleCompare}
                    onCheckMatch={(prop) => {
                      setMatchingProperty(prop);
                      setIsMatchModalOpen(true);
                    }}
                    onFavoriteChange={(id, isFav) => {
                      if (!isFav) {
                        setUndoToast({ propertyId: id, title: p.title });
                        setTimeout(() => setUndoToast(null), 5000);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Undo Toast (Section 52) */}
        {undoToast && (
          <div className="fixed bottom-6 left-6 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 text-xs">
            <span>Removed from favorites.</span>
            <button
              onClick={async () => {
                await api.addFavorite(undoToast.propertyId);
                setUndoToast(null);
              }}
              className="px-2 py-1 bg-brand-700 hover:bg-brand-600 text-white font-bold rounded-lg"
            >
              Undo
            </button>
          </div>
        )}

        {/* Filter Drawer Component */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          subCity={subCity}
          setSubCity={setSubCity}
          neighborhood={neighborhood}
          setNeighborhood={setNeighborhood}
          propertyType={propertyType}
          setPropertyType={setPropertyType}
          minRent={minRent}
          setMinRent={setMinRent}
          maxRent={maxRent}
          setMaxRent={setMaxRent}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          bathrooms={bathrooms}
          setBathrooms={setBathrooms}
          furnished={furnished}
          setFurnished={setFurnished}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={setVerifiedOnly}
          selectedAmenities={selectedAmenities}
          toggleAmenity={toggleAmenity}
          onApply={applyFilters}
          onReset={handleResetFilters}
        />

        {/* Save Search Modal */}
        {isSaveSearchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Bookmark className="w-4 h-4 text-brand-700" />
                  <span>Save This Search</span>
                </div>
                <button onClick={() => setIsSaveSearchModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {saveSearchSuccess ? (
                <div className="py-6 text-center text-xs font-bold text-emerald-700 flex flex-col items-center gap-2">
                  <Check className="w-8 h-8 p-1.5 rounded-full bg-emerald-100 text-emerald-700" />
                  <span>Search preferences saved!</span>
                </div>
              ) : (
                <form onSubmit={handleSaveSearch} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Search Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 2-Bed Bole under 35k"
                      value={savedSearchName}
                      onChange={(e) => setSavedSearchName(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    We'll notify you automatically when new properties matching these filters are listed.
                  </p>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl shadow-xs transition"
                  >
                    Save & Enable Alerts
                  </button>
                </form>
              )}
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
