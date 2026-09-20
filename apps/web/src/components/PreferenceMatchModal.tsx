import React, { useState } from 'react';
import { api } from '../api/client';
import { PropertyMatchResult, ADDIS_ABABA_SUBCITIES, AMENITIES_CATALOG } from '@betoch/shared';
import { X, Sliders, CheckCircle2, XCircle, Sparkles, ShieldCheck } from 'lucide-react';

interface PreferenceMatchModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PreferenceMatchModal: React.FC<PreferenceMatchModalProps> = ({
  propertyId,
  propertyTitle,
  isOpen,
  onClose
}) => {
  const [budget, setBudget] = useState<number>(40000);
  const [subCity, setSubCity] = useState<string>('Bole');
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [furnished, setFurnished] = useState<boolean>(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['generator', 'water_tank', 'parking']);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PropertyMatchResult | null>(null);

  if (!isOpen) return null;

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const match = await api.calculatePreferenceMatch(propertyId, {
        budget,
        subCity,
        bedrooms,
        furnished,
        amenities: selectedAmenities
      });
      setResult(match);
    } catch (err) {
      console.error('Failed to calculate preference match', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <Sparkles className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Intelligent Preference Match</h2>
              <p className="text-xs text-slate-500 truncate max-w-sm">Comparing against: {propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-600" />
              <span>Define Your Stated Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Max Monthly Budget (ETB)</label>
                <input
                  type="number"
                  step={1000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Preferred Sub-City</label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-brand-500"
                >
                  {ADDIS_ABABA_SUBCITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Bedrooms Desired</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Furnishing</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFurnished(true)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border ${
                      furnished ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Furnished
                  </button>
                  <button
                    type="button"
                    onClick={() => setFurnished(false)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border ${
                      !furnished ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Unfurnished
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Priority Amenities</label>
              <div className="flex flex-wrap gap-1.5">
                {AMENITIES_CATALOG.slice(0, 6).map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                      selectedAmenities.includes(amenity.id)
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {amenity.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="mt-4 w-full py-2 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? 'Evaluating Alignment...' : 'Calculate Preference Match'}
            </button>
          </div>

          {/* Results Box */}
          {result && (
            <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-brand-900">{result.overallScore}%</span>
                  <span className="ml-2 text-xs font-semibold text-brand-800">Preference Match</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auditable Calculation</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 italic border-l-2 border-brand-400 pl-2">
                "{result.summary}"
              </p>

              <div className="space-y-2 pt-2 border-t border-brand-200/60">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Factor Breakdown</h4>
                {result.factors.map((f, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                    {f.matched ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{f.factor}</span>
                        <span className="text-[10px] font-semibold text-slate-500">{f.score}%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{f.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
