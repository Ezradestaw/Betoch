import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TrustBadge } from '../components/TrustBadge';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  FileCheck,
  CreditCard,
  PlusCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listings' | 'applications'>('listings');
  const [selectedPropertyForApps, setSelectedPropertyForApps] = useState<string | null>(null);
  const [registrationModalApp, setRegistrationModalApp] = useState<any | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [finalizing, setFinalizing] = useState(false);

  // Fetch my listings
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['owner-listings'],
    queryFn: () => api.getMyListings()
  });

  // Fetch applications for selected property (or first property)
  const effectivePropertyId = selectedPropertyForApps || listings[0]?.id;

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['property-applications', effectivePropertyId],
    queryFn: () => api.getPropertyApplications(effectivePropertyId!),
    enabled: !!effectivePropertyId
  });

  // Accept / Reject mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      api.updateApplicationStatus(appId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-applications'] });
    }
  });

  const handleFinalizeRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationModalApp) return;

    setFinalizing(true);
    try {
      const res = await api.completeRental(registrationModalApp.id, registrationNumber);
      setRegistrationModalApp(null);
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['property-applications'] });
      navigate(`/payments/checkout/${res.id}`);
    } catch (err) {
      console.error('Failed to complete rental', err);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Landlord Control Center</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Property Owner Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your residential listings, review pre-screened tenant applications, and finalize legal lease agreements.
            </p>
          </div>
          <Link
            to="/owner/create-listing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Property
          </Link>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Total Properties</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{listings.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Active Applications</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {listings.reduce((acc, l) => acc + (l.applicationCount || 0), 0)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Rented & Leased</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {listings.filter((l) => l.listingStatus === 'RENTED').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'listings'
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'applications'
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Rental Applications Queue
          </button>
        </div>

        {/* TAB 1: LISTINGS */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            {listingsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading listings...</div>
            ) : listings.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">You haven't listed any properties yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">List your home in Addis Ababa and start receiving verified inquiries.</p>
                <Link to="/owner/create-listing" className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold">
                  Create First Listing
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {listings.map((l: any) => (
                  <div key={l.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <img
                        src={l.primaryImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <TrustBadge type="property" status={l.verificationStatus} size="sm" />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            l.listingStatus === 'RENTED' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {l.listingStatus}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{l.title}</h4>
                        <p className="text-xs text-slate-500">
                          {l.neighborhood}, {l.subCity} • <strong className="text-slate-900 font-bold">{l.monthlyRent.toLocaleString()} ETB</strong>/mo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          setSelectedPropertyForApps(l.id);
                          setActiveTab('applications');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Applications ({l.applicationCount || 0})
                      </button>
                      <Link
                        to={`/properties/${l.slug}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1"
                      >
                        View Public Listing <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPLICATIONS QUEUE */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {/* Property Filter Dropdown */}
            {listings.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600">Select Property:</label>
                <select
                  value={effectivePropertyId || ''}
                  onChange={(e) => setSelectedPropertyForApps(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                >
                  {listings.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.title} ({l.subCity})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              {appsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No applications received yet for this listing.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((app: any) => (
                    <div key={app.id} className="p-6 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm">
                            {app.renter.name?.[0] || 'R'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{app.renter.name}</h4>
                              <TrustBadge type="identity" status={app.renter.identityStatus} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500">
                              {app.renter.phone} • {app.renter.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            app.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900 mb-1">
                          Move-in: {app.proposedStartDate} • {app.occupantsCount} Occupants
                        </p>
                        <p className="italic">"{app.message}"</p>
                      </div>

                      {/* Action buttons */}
                      {app.status === 'SUBMITTED' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'ACCEPTED' })}
                            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm"
                          >
                            Accept Application
                          </button>
                          <button
                            onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'REJECTED' })}
                            className="px-4 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {app.status === 'ACCEPTED' && !app.contractId && (
                        <div className="pt-2">
                          <button
                            onClick={() => setRegistrationModalApp(app)}
                            className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            <FileCheck className="w-4 h-4" />
                            Finalize Rental & Register Lease Agreement
                          </button>
                        </div>
                      )}

                      {app.contractId && (
                        <div className="pt-2">
                          <Link
                            to={`/payments/checkout/${app.contractId}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900"
                          >
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            View Contract & Commission Invoice →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finalize Rental Agreement Modal */}
        {registrationModalApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-1">Finalize Rental Agreement</h3>
              <p className="text-xs text-slate-500 mb-4">
                This will mark the property as <strong>RENTED</strong> and generate the official lease agreement formatted under <strong>Proclamation No. 1320/2024</strong>.
              </p>

              <form onSubmit={handleFinalizeRental} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Woreda Housing Registration No. (Optional or Pending)
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. AA-BOLE-REG-2026-9042"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    If contract registration is in progress at your sub-city office, you can enter it later.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs border border-emerald-200">
                  <span className="font-bold block mb-1">Platform Commission:</span>
                  A standard 10% platform finder fee will be computed for the landlord. You can settle securely via Telebirr.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegistrationModalApp(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={finalizing}
                    className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {finalizing ? 'Finalizing...' : 'Confirm Lease Agreement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
