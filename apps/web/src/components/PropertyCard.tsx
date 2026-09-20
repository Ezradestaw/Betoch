import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize2, Scale, Sparkles } from 'lucide-react';
import { TrustBadge } from './TrustBadge';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export interface PropertyCardItem {
  id: string;
  title: string;
  slug: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  furnished: boolean;
  location: {
    city: string;
    subCity: string;
    neighborhood: string;
  };
  pricing: {
    monthlyRent: number;
    depositAmount: number;
    currency: string;
  };
  verificationStatus: string;
  listingStatus: string;
  primaryImage?: string | null;
  owner?: {
    firstName: string;
    identityStatus: string;
  };
  isFavorite?: boolean;
}

interface PropertyCardProps {
  property: PropertyCardItem;
  onFavoriteChange?: (id: string, isFav: boolean) => void;
  isCompareSelected?: boolean;
  onToggleCompare?: (property: PropertyCardItem) => void;
  onCheckMatch?: (property: PropertyCardItem) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavoriteChange,
  isCompareSelected,
  onToggleCompare,
  onCheckMatch
}) => {
  const { user, openAuthModal } = useAuth();
  const [isFavorite, setIsFavorite] = useState(property.isFavorite || false);
  const [favLoading, setFavLoading] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal('login');
      return;
    }

    setFavLoading(true);
    try {
      if (isFavorite) {
        await api.removeFavorite(property.id);
        setIsFavorite(false);
        onFavoriteChange?.(property.id, false);
      } else {
        await api.addFavorite(property.id);
        setIsFavorite(true);
        onFavoriteChange?.(property.id, true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    } finally {
      setFavLoading(false);
    }
  };

  const formattedRent = new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(property.pricing.monthlyRent);

  const fallbackImage = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  return (
    <Link
      to={`/properties/${property.slug}`}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={property.primaryImage || fallbackImage}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Status Badge overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <TrustBadge type="property" status={property.verificationStatus} size="sm" />
          {property.furnished && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-sm">
              Furnished
            </span>
          )}
        </div>

        {/* Favorite & Compare Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCompare(property);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
                isCompareSelected
                  ? 'bg-brand-700 text-white'
                  : 'bg-white/80 text-slate-700 hover:bg-white hover:text-brand-700'
              }`}
              title={isCompareSelected ? 'Remove from comparison' : 'Compare property'}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleFavorite}
            disabled={favLoading}
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-red-500'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Location pill on bottom left of image */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[11px] font-medium text-white bg-slate-950/60 backdrop-blur-md px-2 py-0.5 rounded-md">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>{property.location.neighborhood}, {property.location.subCity}</span>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900">{formattedRent}</span>
              <span className="text-xs font-semibold text-emerald-800 uppercase">{property.pricing.currency}</span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
              {property.propertyType.toLowerCase()}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-brand-700 transition-colors">
            {property.title}
          </h3>
        </div>

        {/* Features Row */}
        <div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1" title="Bedrooms">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1" title="Bathrooms">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1" title="Area">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.sizeSqm} m²</span>
            </div>
          </div>

          {onCheckMatch && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCheckMatch(property);
              }}
              className="mt-2.5 w-full py-1.5 px-2 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3 h-3 text-brand-600" />
              <span>Calculate Preference Match</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};
