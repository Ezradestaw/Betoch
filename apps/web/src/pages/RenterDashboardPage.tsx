import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PropertyCard } from '../components/PropertyCard';
import { FileText, Heart, MapPin, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';

export const RenterDashboardPage: React.FC = () => {
  const [tab, setTab] = useState<'applications' | 'saved'>('applications');

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.getMyApplications()
  });

  const { data: favorites = [], isLoading: favsLoading, refetch: refetchFavs } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => api.getFavorites()
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Renter Hub</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">My Rental Activity</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your submitted rental applications, communicate with landlords, and view saved homes.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setTab('applications')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'applications'
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            My Applications ({applications.length})
          </button>
          <button
            onClick={() => setTab('saved')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'saved'
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            Saved Homes ({favorites.length})
          </button>
        </div>

        {/* APPLICATIONS TAB */}
        {tab === 'applications' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            {appsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No applications submitted yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Browse verified listings in Addis Ababa and apply directly to homeowners.
                </p>
                <Link to="/properties" className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold">
                  Browse Available Homes
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.map((app: any) => (
                  <div key={app.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <img
                        src={app.primaryImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=300&q=80'}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            app.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {app.status === 'ACCEPTED' ? <CheckCircle className="w-3 h-3" /> : app.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {app.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{app.propertyTitle}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {app.neighborhood}, {app.subCity} • <strong className="text-slate-800 font-bold">{app.monthlyRent.toLocaleString()} ETB</strong>/mo
                        </p>
                        <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Proposed Move-In: <strong>{app.proposedStartDate}</strong> • Landlord: {app.ownerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <Link
                        to={`/properties/${app.propertySlug}`}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                      >
                        View Property <ExternalLink className="w-3 h-3" />
                      </Link>

                      {app.contractId && (
                        <Link
                          to={`/payments/checkout/${app.contractId}`}
                          className="px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-bold hover:bg-brand-800"
                        >
                          View Contract Details
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVED HOMES TAB */}
        {tab === 'saved' && (
          <div>
            {favsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading saved homes...</div>
            ) : favorites.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No saved homes yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Tap the heart icon on any property to save it to your wishlist.
                </p>
                <Link to="/properties" className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold">
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((p: any) => (
                  <PropertyCard
                    key={p.id}
                    property={{
                      ...p,
                      pricing: { monthlyRent: p.monthlyRent, depositAmount: p.monthlyRent * 2, currency: p.currency },
                      location: { city: 'Addis Ababa', subCity: p.subCity, neighborhood: p.neighborhood },
                      isFavorite: true
                    }}
                    onFavoriteChange={() => refetchFavs()}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
