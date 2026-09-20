import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TrustBadge } from '../components/TrustBadge';
import { ApplicationModal } from '../components/ApplicationModal';
import { MessagingDrawer } from '../components/MessagingDrawer';
import { ReportModal } from '../components/ReportModal';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  ShieldCheck,
  CheckCircle,
  MessageSquare,
  FileText,
  AlertTriangle,
  Star,
  Zap,
  Droplet,
  Wifi,
  Car,
  ArrowUpDown,
  Shield,
  Video,
  Sun,
  Utensils,
  Flame,
  Layers,
  Heart
} from 'lucide-react';

const amenityIcons: Record<string, any> = {
  generator: Zap,
  water_tank: Droplet,
  wifi: Wifi,
  parking: Car,
  elevator: ArrowUpDown,
  security_guard: Shield,
  cctv: Video,
  balcony: Sun,
  modern_kitchen: Utensils,
  water_heater: Flame,
  washing_machine: Layers,
  pets_allowed: Heart
};

export const PropertyDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, openAuthModal } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property-details', slug],
    queryFn: () => api.getProperty(slug!),
    enabled: !!slug
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['property-reviews', property?.id],
    queryFn: () => api.getPropertyReviews(property!.id),
    enabled: !!property?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-500">Loading verified listing details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 text-center">
        <div className="max-w-md mx-auto p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Property Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            The listing you are looking for may have been rented, archived, or does not exist.
          </p>
          <Link
            to="/properties"
            className="px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-bold shadow-sm"
          >
            Browse Available Homes
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images?.length > 0 ? property.images : [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80' }];

  const handleApplyClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleMessageClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsMessageDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {applySuccessMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>{applySuccessMessage}</span>
            </div>
            <button onClick={() => setApplySuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">Dismiss</button>
          </div>
        )}

        {/* Gallery & Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm mb-6">
          {/* Top Title & Location Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <TrustBadge type="property" status={property.verificationStatus} size="md" />
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full capitalize">
                  {property.propertyType.toLowerCase()}
                </span>
                {property.furnished && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Furnished
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{property.title}</h1>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{property.location.neighborhood}, Woreda {property.location.woreda || '01'}, {property.location.subCity} Sub-City, Addis Ababa</span>
              </p>
            </div>

            {/* Price block */}
            <div className="text-left lg:text-right bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-baseline lg:justify-end gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {property.pricing.monthlyRent.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-800 uppercase">{property.pricing.currency}</span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center lg:justify-end gap-1">
                <span>Deposit: {property.pricing.depositAmount.toLocaleString()} {property.pricing.currency}</span>
                <span className="text-emerald-700 font-semibold">(Max 2 Mo. Compliant)</span>
              </div>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Main Featured Photo */}
            <div className="lg:col-span-3 aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden shadow-inner relative">
              <img
                src={images[activeImageIndex]?.url || images[0]?.url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails column */}
            <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto max-h-[450px] custom-scrollbar">
              {images.map((img: any, idx: number) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[16/10] lg:aspect-auto lg:h-24 w-28 lg:w-full rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-brand-700 ring-2 ring-brand-600/30' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Specs & Description (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Highlights bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm grid grid-cols-3 sm:grid-cols-4 gap-4 text-center">
              <div className="p-2">
                <Bed className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-slate-500 block">Bedrooms</span>
                <span className="text-sm font-bold text-slate-900">{property.bedrooms}</span>
              </div>
              <div className="p-2">
                <Bath className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-slate-500 block">Bathrooms</span>
                <span className="text-sm font-bold text-slate-900">{property.bathrooms}</span>
              </div>
              <div className="p-2">
                <Maximize2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-slate-500 block">Property Size</span>
                <span className="text-sm font-bold text-slate-900">{property.sizeSqm} m²</span>
              </div>
              <div className="p-2 hidden sm:block">
                <Calendar className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-slate-500 block">Lease Duration</span>
                <span className="text-sm font-bold text-slate-900">{property.pricing.leaseDurationMonths} Mos.</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3">About this Residence</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>

              {property.pricing.utilitiesIncluded?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Utilities Included in Rent:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {property.pricing.utilitiesIncluded.map((u: string) => (
                      <span key={u} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium rounded-lg">
                        ✓ {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amenities Grid */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Building & Living Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities?.map((a: any) => {
                  const Icon = amenityIcons[a.id] || CheckCircle;
                  return (
                    <div key={a.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                      <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{a.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tenant Reviews */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Verified Tenant Reviews ({reviews.length})
                </h3>
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500">No reviews yet for this listing. Be the first verified tenant to review after completing a rental.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900">{r.author.firstName}</span>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{r.ratings.overall}/5</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Landlord Profile & Primary CTAs (1 col) */}
          <div className="space-y-5">
            {/* Landlord Trust Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-lg shadow-sm">
                  {property.owner.firstName?.[0] || 'O'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{property.owner.firstName}</h4>
                  <div className="mt-0.5">
                    <TrustBadge type="owner" status={property.owner.identityStatus} size="sm" />
                  </div>
                </div>
              </div>

              {property.owner.bio && (
                <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{property.owner.bio}"
                </p>
              )}

              <div className="space-y-2.5">
                <button
                  onClick={handleApplyClick}
                  className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/20 flex items-center justify-center gap-2 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Apply to Rent this Home
                </button>

                <button
                  onClick={handleMessageClick}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Direct Message Owner
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Report this listing as fraudulent or inaccurate
                </button>
              </div>
            </div>

            {/* Legal Protection Card */}
            <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-5 border border-emerald-800/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Protected by Ethiopian Law</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                Rentals finalized on Betoch comply with <strong>Proclamation No. 1320/2024</strong>. Advance deposit is protected, and digital agreements are formatted for mandatory registration at your local sub-city Housing office.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ApplicationModal
        property={{
          id: property.id,
          title: property.title,
          monthlyRent: property.pricing.monthlyRent,
          depositAmount: property.pricing.depositAmount,
          currency: property.pricing.currency
        }}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => setApplySuccessMessage('Your rental application was submitted successfully! The owner has been notified.')}
      />

      <MessagingDrawer
        recipientId={property.owner.id}
        recipientName={property.owner.firstName}
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={isMessageDrawerOpen}
        onClose={() => setIsMessageDrawerOpen(false)}
      />

      <ReportModal
        propertyId={property.id}
        reportedUserId={property.owner.id}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
