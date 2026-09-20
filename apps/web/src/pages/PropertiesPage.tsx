import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PropertyCard } from '../components/PropertyCard';
import { ADDIS_ABABA_SUBCITIES, AMENITIES_CATALOG } from '@betoch/shared';
import { Search, SlidersHorizontal, RotateCcw, Building, ShieldCheck } from 'lucide-react';

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
        {/* Top Header & Search Bar */}
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
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
