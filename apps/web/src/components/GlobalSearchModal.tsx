// ==============================================================================
// BETOCH GLOBAL SEARCH (Cmd+K / Ctrl+K)
// Fast, universal keyboard-navigable command & search palette
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Building,
  ShieldCheck,
  Heart,
  FileText,
  Settings,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface QuickItem {
  id: string;
  title: string;
  category: 'Location' | 'Property Type' | 'Navigation' | 'Safety';
  icon: React.ReactNode;
  url: string;
}

const ITEMS: QuickItem[] = [
  // Locations
  { id: 'loc-bole', title: 'Bole (Atlas, Medhanialem, Rwanda)', category: 'Location', icon: <MapPin className="w-4 h-4 text-emerald-600" />, url: '/properties?subCity=Bole' },
  { id: 'loc-yeka', title: 'Yeka (CMC, Ayat, Signal, Megenagna)', category: 'Location', icon: <MapPin className="w-4 h-4 text-emerald-600" />, url: '/properties?subCity=Yeka' },
  { id: 'loc-kirkos', title: 'Kirkos (Kazanchis, Meskel Flower, Olympia)', category: 'Location', icon: <MapPin className="w-4 h-4 text-emerald-600" />, url: '/properties?subCity=Kirkos' },
  { id: 'loc-nifassilk', title: 'Nifas Silk-Lafto (Sarbet, Bisrate Gabriel, Lebu)', category: 'Location', icon: <MapPin className="w-4 h-4 text-emerald-600" />, url: '/properties?subCity=Nifas%20Silk-Lafto' },
  { id: 'loc-arada', title: 'Arada (Piassa, 4 Kilo, 6 Kilo)', category: 'Location', icon: <MapPin className="w-4 h-4 text-emerald-600" />, url: '/properties?subCity=Arada' },
  { id: 'loc-lideta', title: 'Lideta (Mexico, Balcha, Lideta Condominium)', category: 'Location', icon: <MapPin className="w-4 h-4 text-emerald-600" />, url: '/properties?subCity=Lideta' },

  // Property Types
  { id: 'type-apt', title: 'Apartments for Rent in Addis Ababa', category: 'Property Type', icon: <Building className="w-4 h-4 text-brand-600" />, url: '/properties?propertyType=APARTMENT' },
  { id: 'type-villa', title: 'Stand-alone Villas & Compounds', category: 'Property Type', icon: <Building className="w-4 h-4 text-brand-600" />, url: '/properties?propertyType=VILLA' },
  { id: 'type-condo', title: 'Condominium Units (40/60 & 20/80)', category: 'Property Type', icon: <Building className="w-4 h-4 text-brand-600" />, url: '/properties?propertyType=CONDOMINIUM' },
  { id: 'type-studio', title: 'Furnished Studios & Rooms', category: 'Property Type', icon: <Building className="w-4 h-4 text-brand-600" />, url: '/properties?propertyType=STUDIO' },

  // Quick Navigation
  { id: 'nav-props', title: 'Browse All Verified Properties', category: 'Navigation', icon: <Search className="w-4 h-4 text-blue-600" />, url: '/properties' },
  { id: 'nav-saved', title: 'My Saved Homes & Collections', category: 'Navigation', icon: <Heart className="w-4 h-4 text-red-500" />, url: '/renter/saved' },
  { id: 'nav-apps', title: 'My Rental Applications Queue', category: 'Navigation', icon: <FileText className="w-4 h-4 text-purple-600" />, url: '/renter/applications' },
  { id: 'nav-owner', title: 'Landlord & Owner Dashboard', category: 'Navigation', icon: <Building className="w-4 h-4 text-emerald-700" />, url: '/owner/dashboard' },
  { id: 'nav-create', title: 'Publish a New Rental Listing', category: 'Navigation', icon: <Sparkles className="w-4 h-4 text-amber-600" />, url: '/owner/create-listing' },
  { id: 'nav-trust', title: 'Trust Center (Fayda & Carta Verification)', category: 'Safety', icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, url: '/trust' },
  { id: 'nav-safety', title: 'Safety Tips & Anti-Scam Guide', category: 'Safety', icon: <ShieldCheck className="w-4 h-4 text-amber-600" />, url: '/safety' },
  { id: 'nav-settings', title: 'Account Preferences & Security Settings', category: 'Navigation', icon: <Settings className="w-4 h-4 text-slate-600" />, url: '/settings' }
];

export const GlobalSearchModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = ITEMS.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search sub-cities, property types, or jump to a page..."
            className="flex-1 text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching pages or locations found.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.url)}
                className={`w-full p-3 text-left rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                  idx === selectedIndex ? 'bg-brand-50/80 text-brand-900' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      {item.category}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with <strong>Cmd+K</strong> from anywhere</span>
          <span>Betoch Quick Jump</span>
        </div>
      </div>
    </div>
  );
};
