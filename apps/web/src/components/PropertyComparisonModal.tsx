import React from 'react';
import { PropertyComparisonResult } from '@betoch/shared';
import { X, Check, ArrowRight, Building, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PropertyComparisonModalProps {
  comparison: PropertyComparisonResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  comparison,
  isOpen,
  onClose
}) => {
  if (!isOpen || !comparison) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <Sparkles className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Side-by-Side Property Comparison</h2>
              <p className="text-xs text-slate-500">Objective analysis based strictly on verified platform data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative Box */}
        <div className="mb-4 p-3.5 bg-brand-50/60 rounded-xl border border-brand-200 text-xs text-brand-900 leading-relaxed">
          <span className="font-bold block text-[11px] uppercase tracking-wider text-brand-700 mb-1">
            Executive Comparison
          </span>
          {comparison.comparisonNarrative}
        </div>

        {/* Comparison Matrix Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-3 bg-slate-50 font-bold text-slate-700 w-36">Feature</th>
                {comparison.properties.map((p) => (
                  <th key={p.id} className="p-3 bg-white min-w-[200px] align-top">
                    <div className="space-y-2">
                      <img
                        src={p.primaryImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                        alt={p.title}
                        className="w-full h-28 object-cover rounded-xl border border-slate-100"
                      />
                      <h4 className="font-bold text-slate-900 line-clamp-2 text-xs">{p.title}</h4>
                      <Link
                        to={`/properties/${p.slug}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
                      >
                        View Full Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 bg-slate-50/70 font-semibold text-slate-600">Monthly Rent</td>
                {comparison.properties.map((p) => (
                  <td key={p.id} className="p-3 font-bold text-slate-900">
                    {p.monthlyRent.toLocaleString()} ETB
                    {comparison.summaryHighlights.lowestRentId === p.id && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-md font-semibold">
                        Best Price
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-slate-50/70 font-semibold text-slate-600">Deposit Cap Check</td>
                {comparison.properties.map((p) => {
                  const maxDeposit = p.monthlyRent * 2;
                  const isCompliant = p.depositAmount <= maxDeposit;
                  return (
                    <td key={p.id} className="p-3 text-slate-700">
                      {p.depositAmount.toLocaleString()} ETB ({Math.round(p.depositAmount / p.monthlyRent)} mos)
                      {isCompliant ? (
                        <span className="ml-1.5 text-emerald-700 text-[10px] font-bold">✓ Law Compliant</span>
                      ) : (
                        <span className="ml-1.5 text-amber-600 text-[10px] font-bold">Exceeds limit</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 bg-slate-50/70 font-semibold text-slate-600">Location</td>
                {comparison.properties.map((p) => (
                  <td key={p.id} className="p-3 text-slate-700">
                    {p.subCity} ({p.neighborhood})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-slate-50/70 font-semibold text-slate-600">Rooms</td>
                {comparison.properties.map((p) => (
                  <td key={p.id} className="p-3 text-slate-700">
                    {p.bedrooms} bed • {p.bathrooms} bath
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-slate-50/70 font-semibold text-slate-600">Floor Space</td>
                {comparison.properties.map((p) => (
                  <td key={p.id} className="p-3 text-slate-700 font-medium">
                    {p.sizeSqm} m²
                    {comparison.summaryHighlights.largestSizeId === p.id && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-md font-semibold">
                        Largest
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-slate-50/70 font-semibold text-slate-600">Furnishing</td>
                {comparison.properties.map((p) => (
                  <td key={p.id} className="p-3 text-slate-700">
                    {p.furnished ? 'Furnished' : 'Unfurnished'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-slate-50/70 font-semibold text-slate-600">Amenities</td>
                {comparison.properties.map((p) => (
                  <td key={p.id} className="p-3 text-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {p.amenities.map((a) => (
                        <span key={a} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
