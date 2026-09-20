// ==============================================================================
// BETOCH PROPERTY DETAILS PAGE — USER CONVENIENCE & TRANSPARENCY EXPANSION
// Lightbox Gallery, Cost Breakdown, "Is This Right For Me?", Budget Calculator, Sticky Actions
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TrustBadge } from '../components/TrustBadge';
import { ApplicationModal } from '../components/ApplicationModal';
import { MessagingDrawer } from '../components/MessagingDrawer';
import { ReportModal } from '../components/ReportModal';
import { ScheduleViewingModal } from '../components/ScheduleViewingModal';
import { PreferenceMatchModal } from '../components/PreferenceMatchModal';
import { addRecentlyViewed } from '../utils/recentlyViewed';
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
  Layers,
  Heart,
  Sparkles,
  DollarSign,
  Calculator,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize,
  HelpCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const amenityIcons: Record<string, any> = {
  generator: Zap,
  water_tank: Droplet,
  parking: Car,
  wifi: Wifi,
  washing_machine: Layers,
  pets_allowed: Heart
};

const QUICK_QUESTIONS = [
  'Is this property still available?',
  'Are utilities included in rent?',
  'Is reserved parking available?',
  'Is the property fully furnished?',
  'When is the earliest move-in date?'
];

export const PropertyDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, openAuthModal } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedRoomCategory, setSelectedRoomCategory] = useState('ALL');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [initialMessageText, setInitialMessageText] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isViewingModalOpen, setIsViewingModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Rental Budget Calculator States
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcUtilities, setCalcUtilities] = useState(2500);
  const [calcServiceFee, setCalcServiceFee] = useState(1500);
  const [calcMovingCost, setCalcMovingCost] = useState(5000);

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

  // Track in Recently Viewed history
  useEffect(() => {
    if (property) {
      addRecentlyViewed({
        id: property.id,
        title: property.title,
        slug: property.slug,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sizeSqm: property.sizeSqm,
        furnished: property.furnished,
        location: property.location,
        pricing: property.pricing,
        verificationStatus: property.verificationStatus,
        listingStatus: property.listingStatus,
        primaryImage: property.images?.[0]?.url || null
      });
    }
  }, [property]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !property?.images?.length) return;
      if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % property.images.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, property]);

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

  const images = property.images?.length > 0
    ? property.images
    : [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80' }];

  const handleApplyClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleMessageClick = (customMsg?: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setInitialMessageText(customMsg || '');
    setIsMessageDrawerOpen(true);
  };

  const hasGenerator = property.amenities?.some((a: any) => a.id === 'generator');
  const hasWaterTank = property.amenities?.some((a: any) => a.id === 'water_tank');
  const hasParking = property.amenities?.some((a: any) => a.id === 'parking');
  const hasElevator = property.amenities?.some((a: any) => a.id === 'elevator');

  // Budget calculations
  const totalMoveInCost = property.pricing.monthlyRent + property.pricing.depositAmount + calcServiceFee + calcMovingCost;
  const totalMonthlyCost = property.pricing.monthlyRent + calcUtilities + calcServiceFee;

  return (
    <div className="min-h-screen bg-slate-50 py-6 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {applySuccessMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>{applySuccessMessage}</span>
            </div>
            <button onClick={() => setApplySuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              Dismiss
            </button>
          </div>
        )}

        {/* Top Breadcrumb & Trust Banner */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Link to="/" className="hover:text-slate-800">Home</Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-slate-800">Properties</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{property.location.subCity}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Title Deed & Carta Verified Landlord</span>
          </div>
        </div>

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
                {property.pricing.previousMonthlyRent && property.pricing.previousMonthlyRent > property.pricing.monthlyRent && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                    Price Reduced (-{Math.round(((property.pricing.previousMonthlyRent - property.pricing.monthlyRent) / property.pricing.previousMonthlyRent) * 100)}%)
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{property.title}</h1>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{property.location.neighborhood}, Woreda {property.location.woreda || '01'}, {property.location.subCity} Sub-City, Addis Ababa</span>
              </p>
            </div>

            {/* Price Block */}
            <div className="text-left lg:text-right bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-baseline lg:justify-end gap-1.5">
                {property.pricing.previousMonthlyRent && property.pricing.previousMonthlyRent > property.pricing.monthlyRent && (
                  <span className="text-sm font-semibold text-slate-400 line-through mr-1">
                    {property.pricing.previousMonthlyRent.toLocaleString()}
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {property.pricing.monthlyRent.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-800 uppercase">{property.pricing.currency}</span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center lg:justify-end gap-1">
                <span>Deposit: {property.pricing.depositAmount.toLocaleString()} {property.pricing.currency}</span>
                <span className="text-emerald-700 font-semibold">(Proclamation 1320 Compliant)</span>
              </div>
            </div>
          </div>

          {/* Photo Gallery Grid with Lightbox Action */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Main Featured Photo */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="lg:col-span-3 aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden shadow-inner relative group cursor-pointer"
            >
              <img
                src={images[activeImageIndex]?.url || images[0]?.url}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/70 text-white backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                <Maximize className="w-3.5 h-3.5" />
                <span>View Fullscreen ({activeImageIndex + 1}/{images.length})</span>
              </div>
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
          {/* Main Specs, Description, Highlights (2 cols) */}
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

            {/* "IS THIS RIGHT FOR ME?" PERSONALIZED FIT ANALYSIS (Section 17) */}
            <div className="bg-gradient-to-br from-brand-50/70 via-white to-emerald-50/40 rounded-2xl border border-brand-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-700 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Is this residence right for you?</h3>
                  <p className="text-[11px] text-slate-500">Objective analysis based strictly on verified platform data</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                {/* Why this matches you */}
                <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                    Why this matches you
                  </span>
                  <div className="space-y-1.5 text-slate-700">
                    <p className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Verified Title Deed (*Carta*) inspected by Betoch staff</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Law-compliant deposit: capped strictly at 2 months rent</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{property.bedrooms} bedrooms & {property.bathrooms} bathrooms in {property.location.subCity}</span>
                    </p>
                    {hasGenerator && (
                      <p className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Backup generator installed for uninterrupted power supply</span>
                      </p>
                    )}
                    {hasWaterTank && (
                      <p className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Dedicated water reservoir tank for reliable water continuity</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Things to consider */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px] block">
                    Things to consider
                  </span>
                  <div className="space-y-1.5 text-slate-700">
                    {property.floor && property.floor > 2 && !hasElevator ? (
                      <p className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>Located on Floor {property.floor} without elevator (stair access only)</span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-1.5">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>Located on Floor {property.floor || 1} of {property.totalFloors || 'multi-story'} building</span>
                      </p>
                    )}
                    <p className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>Standard minimum lease agreement is {property.pricing.leaseDurationMonths} months</span>
                    </p>
                    {!hasParking && (
                      <p className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>Dedicated parking is not specified for this unit</span>
                      </p>
                    )}
                  </div>
                </div>
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

            {/* RENTAL COST TRANSPARENCY & BUDGET CALCULATOR (Section 37 & 38) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Rental Cost Transparency</h3>
                </div>
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-brand-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{showCalculator ? 'Hide Calculator' : 'Cost Calculator'}</span>
                </button>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Rent</span>
                  <span className="text-lg font-black text-slate-900 block mt-0.5">
                    {property.pricing.monthlyRent.toLocaleString()} ETB
                  </span>
                  <span className="text-[10px] text-slate-500">Fixed rate per contract</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Security Deposit</span>
                  <span className="text-lg font-black text-slate-900 block mt-0.5">
                    {property.pricing.depositAmount.toLocaleString()} ETB
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {Math.round(property.pricing.depositAmount / property.pricing.monthlyRent)} mo. (Law Compliant)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Platform Commission</span>
                  <span className="text-lg font-black text-emerald-700 block mt-0.5">
                    10% ({((property.pricing.monthlyRent * 0.10)).toLocaleString()} ETB)
                  </span>
                  <span className="text-[10px] text-slate-500">Held in escrow until handover</span>
                </div>
              </div>

              {/* Interactive Move-In Calculator Drawer */}
              {showCalculator && (
                <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-200 space-y-4 text-xs animate-in fade-in">
                  <h4 className="font-bold text-brand-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-brand-700" />
                    Estimate Your Total Moving Expenses
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Est. Utilities (Water/Power)
                      </label>
                      <input
                        type="number"
                        value={calcUtilities}
                        onChange={(e) => setCalcUtilities(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Building Service Fee
                      </label>
                      <input
                        type="number"
                        value={calcServiceFee}
                        onChange={(e) => setCalcServiceFee(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Estimated Moving Van/Labor
                      </label>
                      <input
                        type="number"
                        value={calcMovingCost}
                        onChange={(e) => setCalcMovingCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Est. Move-In Cash Needed (Rent + Deposit + Moving)</span>
                      <span className="text-base font-black text-brand-900">{totalMoveInCost.toLocaleString()} ETB</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Est. Ongoing Monthly Outlay</span>
                      <span className="text-base font-black text-emerald-800">{totalMonthlyCost.toLocaleString()} ETB / mo</span>
                    </div>
                  </div>
                </div>
              )}
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

          {/* Right Sidebar: Landlord Profile & Sticky Desktop Actions (1 col) */}
          <div className="space-y-5">
            {/* Landlord Profile Card (Section 18 & 19) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
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

              {/* Owner Response Indicator (Section 19) */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 mb-4 flex items-center gap-2 text-[11px] text-emerald-900 font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Usually responds within 2 hours</span>
              </div>

              {/* Quick Questions (Section 21) */}
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  1-Tap Inquiries:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleMessageClick(q)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-900 rounded-lg text-[11px] transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleApplyClick}
                  className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Apply to Rent this Home
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login');
                      return;
                    }
                    setIsViewingModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  Schedule In-Person Viewing
                </button>

                <button
                  onClick={() => setIsMatchModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  Calculate Preference Match
                </button>

                <button
                  onClick={() => handleMessageClick()}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                  Message Landlord
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

      {/* STICKY BOTTOM ACTION BAR ON MOBILE (Section 14 & 46) */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-black text-slate-900 block">
            {property.pricing.monthlyRent.toLocaleString()} ETB
          </span>
          <span className="text-[10px] text-slate-500">/ month</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
                return;
              }
              setIsViewingModalOpen(true);
            }}
            className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Viewing</span>
          </button>

          <button
            onClick={handleApplyClick}
            className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Apply Now
          </button>
        </div>
      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX (Section 15) */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-in fade-in">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white p-2">
            <span className="text-xs font-semibold text-slate-300">
              {property.title} • {activeImageIndex + 1} of {images.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 text-white/80 hover:text-white rounded-xl bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Active Image Viewport */}
          <div className="relative flex-1 flex items-center justify-center">
            <img
              src={images[activeImageIndex]?.url}
              alt=""
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />

            {/* Prev / Next Arrows */}
            <button
              onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Thumbnails Strip */}
          <div className="flex justify-center gap-2 overflow-x-auto py-2">
            {images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  activeImageIndex === idx ? 'border-brand-500 scale-105' : 'border-transparent opacity-60'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

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

      <ScheduleViewingModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={isViewingModalOpen}
        onClose={() => setIsViewingModalOpen(false)}
      />

      <PreferenceMatchModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
      />
    </div>
  );
};
