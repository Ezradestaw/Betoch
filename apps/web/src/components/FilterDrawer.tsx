// ==============================================================================
// BETOCH ADVANCED MOBILE-FIRST FILTER DRAWER
// ==============================================================================

import React from 'react';
import { ADDIS_ABABA_SUBCITIES, AMENITIES_CATALOG } from '@betoch/shared';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Building,
  ShieldCheck,
  DollarSign,
  Sparkles
} from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subCity: string;
  setSubCity: (v: string) => void;
  neighborhood: string;
  setNeighborhood: (v: string) => void;
  propertyType: string;
  setPropertyType: (v: string) => void;
  minRent: string;
  setMinRent: (v: string) => void;
  maxRent: string;
  setMaxRent: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  bathrooms: string;
  setBathrooms: (v: string) => void;
  furnished: boolean;
  setFurnished: (v: boolean) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  selectedAmenities: string[];
  toggleAmenity: (id: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const PROPERTY_TYPES = [
  { id: '', label: 'Any Type' },
  { id: 'APARTMENT', label: 'Apartment' },
  { id: 'CONDOMINIUM', label: 'Condominium' },
  { id: 'VILLA', label: 'Villa' },
  { id: 'STUDIO', label: 'Studio' },
  { id: 'TOWNHOUSE', label: 'Townhouse' },
  { id: 'ROOM', label: 'Room' }
];

const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4+'];
const BATHROOM_OPTIONS = ['Any', '1', '2', '3+'];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  subCity,
  setSubCity,
  neighborhood,
  setNeighborhood,
  propertyType,
  setPropertyType,
  minRent,
  setMinRent,
  maxRent,
  setMaxRent,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  furnished,
  setFurnished,
  verifiedOnly,
  setVerifiedOnly,
  selectedAmenities,
  toggleAmenity,
  onApply,
  onReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-700" />
              <h2 className="text-sm font-bold text-slate-900">Advanced Property Filters</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onReset}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
            {/* Location: Sub-City & Neighborhood */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Location in Addis Ababa
              </label>
              <div className="space-y-2">
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Sub-Cities</option>
                  {ADDIS_ABABA_SUBCITIES.map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Neighborhood (e.g. Kazanchis, Bole Atlas, CMC)"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Price Range (ETB) */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Monthly Rent (ETB)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Minimum</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minRent}
                    onChange={(e) => setMinRent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Maximum</span>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Property Type */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Property Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PROPERTY_TYPES.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => setPropertyType(pt.id)}
                    className={`p-2 rounded-xl border text-center font-medium transition-all ${
                      propertyType === pt.id
                        ? 'border-brand-700 bg-brand-50 text-brand-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Bedrooms
              </label>
              <div className="flex gap-2">
                {BEDROOM_OPTIONS.map((b) => {
                  const val = b === 'Any' ? '' : b.replace('+', '');
                  const isSelected = bedrooms === val;
                  return (
                    <button
                      key={b}
                      onClick={() => setBedrooms(isSelected ? '' : val)}
                      className={`flex-1 py-2 rounded-xl border text-center font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-900 border-brand-900 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Bathrooms
              </label>
              <div className="flex gap-2">
                {BATHROOM_OPTIONS.map((b) => {
                  const val = b === 'Any' ? '' : b.replace('+', '');
                  const isSelected = bathrooms === val;
                  return (
                    <button
                      key={b}
                      onClick={() => setBathrooms(isSelected ? '' : val)}
                      className={`flex-1 py-2 rounded-xl border text-center font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-900 border-brand-900 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Furnishing & Verification Toggles */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={furnished}
                  onChange={(e) => setFurnished(e.target.checked)}
                  className="rounded text-brand-700 focus:ring-brand-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">Furnished Homes Only</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Title Deeds Only (*Carta* Inspected)
                </span>
              </label>
            </div>

            {/* Essential Amenities */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Amenities
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES_CATALOG.map((a) => {
                  const isChecked = selectedAmenities.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAmenity(a.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-brand-700 bg-brand-50/70 text-brand-900 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{a.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-brand-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-white flex gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold shadow-md shadow-brand-700/20 transition-all text-center"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
