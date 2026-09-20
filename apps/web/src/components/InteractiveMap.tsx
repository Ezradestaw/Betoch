// ==============================================================================
// BETOCH INTERACTIVE MAP COMPONENT FOR ADDIS ABABA
// Fast, lightweight, zero-external-SDK interactive map with coordinates and clustering
// ==============================================================================

import React, { useState } from 'react';
import { PropertyCardItem } from './PropertyCard';
import { MapPin, ShieldCheck, ArrowRight, X, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InteractiveMapProps {
  properties: PropertyCardItem[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (id: string) => void;
}

// Approximate coordinate anchors for Addis Ababa (Lat: 8.95 to 9.06, Lng: 38.68 to 38.85)
const ADDIS_BOUNDS = {
  minLat: 8.95,
  maxLat: 9.06,
  minLng: 38.68,
  maxLng: 38.85
};

const SUBCITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Bole: { lat: 8.995, lng: 38.788 },
  Kirkos: { lat: 9.012, lng: 38.753 },
  Yeka: { lat: 9.041, lng: 38.795 },
  Arada: { lat: 9.035, lng: 38.752 },
  Lideta: { lat: 9.008, lng: 38.735 },
  'Nifas Silk-Lafto': { lat: 8.968, lng: 38.732 },
  'Kolfe Keranio': { lat: 9.015, lng: 38.705 },
  Gullele: { lat: 9.062, lng: 38.738 },
  'Addis Ketema': { lat: 9.031, lng: 38.736 },
  'Akaki Kality': { lat: 8.905, lng: 38.765 },
  'Lemi Kura': { lat: 9.022, lng: 38.835 }
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty
}) => {
  const [activeProperty, setActiveProperty] = useState<PropertyCardItem | null>(null);

  // Convert lat/lng to percentage offset in SVG
  const getCoordinates = (p: PropertyCardItem, index: number) => {
    let lat = p.location?.latitudeApprox;
    let lng = p.location?.longitudeApprox;

    if (!lat || !lng) {
      const fallback = SUBCITY_COORDS[p.location?.subCity] || { lat: 9.01, lng: 38.76 };
      // Spread nearby items slightly so they don't overlap completely
      const jitterLat = (Math.sin(index * 1.5) * 0.008);
      const jitterLng = (Math.cos(index * 1.5) * 0.008);
      lat = fallback.lat + jitterLat;
      lng = fallback.lng + jitterLng;
    }

    const x = ((lng - ADDIS_BOUNDS.minLng) / (ADDIS_BOUNDS.maxLng - ADDIS_BOUNDS.minLng)) * 100;
    const y = 100 - ((lat - ADDIS_BOUNDS.minLat) / (ADDIS_BOUNDS.maxLat - ADDIS_BOUNDS.minLat)) * 100;

    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y))
    };
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex flex-col">
      {/* Map Canvas Background with stylized Addis Ababa grid */}
      <div className="absolute inset-0 bg-radial from-slate-50 to-slate-200 pointer-events-none">
        {/* Decorative streets and grid lines */}
        <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Main Addis Transit Corridors */}
          <path d="M 0 50 Q 200 40 400 80 T 800 120" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4,2" />
          <path d="M 250 0 Q 300 200 350 400 T 500 800" fill="none" stroke="#64748b" strokeWidth="2" />
          <path d="M 100 300 L 700 200" fill="none" stroke="#cbd5e1" strokeWidth="3" />
        </svg>
      </div>

      {/* Sub-city Zone Labels */}
      <div className="absolute inset-0 pointer-events-none p-4">
        <span className="absolute top-12 left-10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Gullele
        </span>
        <span className="absolute top-24 left-1/3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Arada
        </span>
        <span className="absolute top-20 right-16 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Yeka
        </span>
        <span className="absolute top-1/2 left-28 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Kirkos / Kazanchis
        </span>
        <span className="absolute top-1/2 right-20 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Bole
        </span>
        <span className="absolute bottom-16 right-1/4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Lemi Kura / CMC
        </span>
        <span className="absolute bottom-12 left-16 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Nifas Silk
        </span>
      </div>

      {/* Top Map Control Pill */}
      <div className="relative z-10 m-3 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Layers className="w-3.5 h-3.5 text-brand-700" />
          <span>Addis Ababa Real Estate Map</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
            {properties.length} Listings
          </span>
        </div>
      </div>

      {/* Property Pins */}
      <div className="relative flex-1 w-full h-full">
        {properties.map((p, idx) => {
          const { x, y } = getCoordinates(p, idx);
          const isSelected = selectedPropertyId === p.id || activeProperty?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setActiveProperty(p);
                if (onSelectProperty) onSelectProperty(p.id);
              }}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                isSelected ? 'scale-110 z-30' : 'hover:scale-105'
              }`}
            >
              <div
                className={`px-2 py-1 rounded-full text-[11px] font-bold shadow-md flex items-center gap-1 border transition-all ${
                  isSelected
                    ? 'bg-brand-900 text-white border-brand-950 ring-2 ring-brand-400'
                    : 'bg-white text-slate-900 border-slate-300 hover:border-brand-600'
                }`}
              >
                {p.verificationStatus === 'VERIFIED' && (
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
                <span>{((p.pricing?.monthlyRent || 0) / 1000).toFixed(0)}k ETB</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Property Popup Card */}
      {activeProperty && (
        <div className="relative z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={activeProperty.primaryImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=300&q=80'}
              alt=""
              className="w-16 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">
                {activeProperty.location?.subCity} ({activeProperty.location?.neighborhood})
              </span>
              <h4 className="text-xs font-bold text-slate-900 truncate">{activeProperty.title}</h4>
              <p className="text-xs font-extrabold text-brand-900">
                {(activeProperty.pricing?.monthlyRent || 0).toLocaleString()} ETB <span className="text-[10px] font-normal text-slate-500">/ mo</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/properties/${activeProperty.slug}`}
              className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
            >
              View <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setActiveProperty(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
