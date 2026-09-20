// ==============================================================================
// BETOCH OWNER PROFILE PAGE
// Public landlord transparency profile, verified credentials, and active listings
// ==============================================================================

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PropertyCard } from '../components/PropertyCard';
import {
  ShieldCheck,
  Building,
  Clock,
  CheckCircle,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const OwnerProfilePage: React.FC = () => {
  const { ownerId } = useParams<{ ownerId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-profile', ownerId],
    queryFn: () => (ownerId ? api.getOwnerProfile(ownerId) : Promise.reject('No ID')),
    enabled: !!ownerId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data?.owner) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-slate-200">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Owner Profile Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            The landlord profile you requested could not be located or has no active listings.
          </p>
          <Link
            to="/properties"
            className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold"
          >
            Browse Verified Homes
          </Link>
        </div>
      </div>
    );
  }

  const { owner, properties = [] } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Property Listings</span>
          </Link>
        </div>

        {/* Owner Profile Banner Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-brand-700 text-white text-2xl font-black flex items-center justify-center shadow-md shrink-0">
                {owner.avatarUrl ? (
                  <img
                    src={owner.avatarUrl}
                    alt={owner.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  owner.name?.[0] || 'O'
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{owner.name}</h1>
                  {owner.identityStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Fayda Verified
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                  {owner.bio}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Member since {new Date(owner.memberSince).getFullYear()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {owner.responseTime}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {owner.responseRate} Response Rate
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 gap-4">
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Addis Ababa Portfolio
                </span>
                <span className="text-lg font-black text-slate-900">
                  {owner.totalProperties} Listed • {owner.rentedProperties} Rented
                </span>
              </div>

              <Link
                to="/messages"
                className="px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Owner
              </Link>
            </div>
          </div>
        </div>

        {/* Safety Notice Box */}
        <div className="mb-8 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              All listings from verified owners are protected by Betoch Proclamation 1320/2024 standardized lease contracts.
            </span>
          </div>
          <Link to="/trust" className="text-emerald-800 font-bold hover:underline shrink-0 hidden sm:block">
            Learn more →
          </Link>
        </div>

        {/* Active Listings Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Active Listings ({properties.length})
            </h2>
            <span className="text-xs text-slate-500">
              Verified properties available for rent
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No active listings at this moment</p>
              <p className="text-[11px] text-slate-400 mt-1">
                This owner currently has all properties rented out.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
