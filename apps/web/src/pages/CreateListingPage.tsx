import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ADDIS_ABABA_SUBCITIES, AMENITIES_CATALOG, PropertyType } from '@betoch/shared';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Eye,
  Building,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const CreateListingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    propertyType: PropertyType.APARTMENT,
    description: '',
    bedrooms: 2,
    bathrooms: 2,
    floor: 2,
    totalFloors: 5,
    sizeSqm: 120,
    furnished: true,

    // Step 2: Location
    country: 'Ethiopia',
    city: 'Addis Ababa',
    subCity: 'Bole',
    woreda: '03',
    neighborhood: '',

    // Step 3: Terms
    monthlyRent: 35000,
    depositAmount: 70000, // Max 2 months rent
    leaseDurationMonths: 12,
    availableFrom: new Date().toISOString().split('T')[0],
    utilitiesIncluded: ['Water', 'Security'],

    // Step 4: Amenities
    amenityIds: ['water_tank', 'generator', 'wifi', 'parking', 'security_guard'],

    // Step 5: Photos
    imageUrls: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    primaryImageIndex: 0,

    // Step 6: Documents
    titleDeedUrl: '/uploads/verifications/sample_title_deed.pdf'
  });

  const [newImageUrl, setNewImageUrl] = useState('');

  // AI Assistant States
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [ownerNotes, setOwnerNotes] = useState('');
  const [generatedHighlights, setGeneratedHighlights] = useState<string[]>([]);

  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<any>(null);

  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [photoFeedbacks, setPhotoFeedbacks] = useState<any[]>([]);

  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
  const [qualityScore, setQualityScore] = useState<any>(null);

  const handleGenerateDescription = async () => {
    setIsGeneratingDesc(true);
    try {
      const res = await api.generateDescription({
        propertyType: formData.propertyType,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        subCity: formData.subCity,
        neighborhood: formData.neighborhood || 'Bole Atlas',
        sizeSqm: formData.sizeSqm,
        furnished: formData.furnished,
        monthlyRent: formData.monthlyRent,
        amenities: formData.amenityIds,
        ownerNotes: ownerNotes.trim() || undefined
      });
      setFormData((prev) => ({
        ...prev,
        description: res.fullDescription,
        title: prev.title || res.shortDescription
      }));
      setGeneratedHighlights(res.keyHighlights || []);
    } catch (err: any) {
      alert(err.message || 'Description generation failed.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleEstimatePrice = async () => {
    setIsEstimatingPrice(true);
    try {
      const res = await api.estimatePrice({
        subCity: formData.subCity,
        propertyType: formData.propertyType,
        bedrooms: formData.bedrooms,
        sizeSqm: formData.sizeSqm,
        furnished: formData.furnished,
        amenityIds: formData.amenityIds
      });
      setPriceEstimate(res);
    } catch (err: any) {
      alert(err.message || 'Failed to estimate market price.');
    } finally {
      setIsEstimatingPrice(false);
    }
  };

  const handleAnalyzePhotos = async () => {
    if (formData.imageUrls.length === 0) return;
    setIsAnalyzingPhotos(true);
    try {
      const res = await api.analyzePhotos(formData.imageUrls);
      setPhotoFeedbacks(res);
    } catch (err: any) {
      alert(err.message || 'Photo analysis failed.');
    } finally {
      setIsAnalyzingPhotos(false);
    }
  };

  const handleAnalyzeQuality = async () => {
    setIsAnalyzingQuality(true);
    try {
      const score = await api.analyzeQuality({
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        sizeSqm: formData.sizeSqm,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        monthlyRent: formData.monthlyRent,
        depositAmount: formData.depositAmount,
        imageUrls: formData.imageUrls,
        amenityIds: formData.amenityIds,
        subCity: formData.subCity,
        neighborhood: formData.neighborhood,
        availableFrom: formData.availableFrom
      });
      setQualityScore(score);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAnalyzingQuality(false);
    }
  };

  const steps = [
    { num: 1, title: 'Basic Info' },
    { num: 2, title: 'Location' },
    { num: 3, title: 'Pricing & Terms' },
    { num: 4, title: 'Amenities' },
    { num: 5, title: 'Photos' },
    { num: 6, title: 'Title Deed' },
    { num: 7, title: 'Preview' },
    { num: 8, title: 'Submit' }
  ];

  const maxAllowedDeposit = formData.monthlyRent * 2;
  const isDepositValid = formData.depositAmount <= maxAllowedDeposit;

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      primaryImageIndex: 0
    }));
  };

  const toggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id)
        ? prev.amenityIds.filter((item) => item !== id)
        : [...prev.amenityIds, id]
    }));
  };

  const toggleUtility = (u: string) => {
    setFormData((prev) => ({
      ...prev,
      utilitiesIncluded: prev.utilitiesIncluded.includes(u)
        ? prev.utilitiesIncluded.filter((item) => item !== u)
        : [...prev.utilitiesIncluded, u]
    }));
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.createProperty(formData);
      navigate(`/properties/${res.slug}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing. Please verify all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Wizard Header */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Homeowner Listing Wizard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Publish a Verified Property</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete the 8 steps below to list your home on Betoch with full legal compliance.
          </p>

          {/* Stepper Progress Bar */}
          <div className="mt-6 flex items-center justify-between overflow-x-auto pb-2 custom-scrollbar">
            {steps.map((s) => (
              <div key={s.num} className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    currentStep === s.num
                      ? 'bg-brand-700 text-white shadow-sm'
                      : currentStep > s.num
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/10">
                    {currentStep > s.num ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span>{s.title}</span>
                </button>
                {s.num < steps.length && (
                  <div className="w-4 h-0.5 bg-slate-200 mx-1 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Card Body */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          {/* STEP 1: BASIC INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3">Step 1: Basic Property Details</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern 3-Bedroom Apartment in Bole Atlas with Backup Power"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Property Type</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="VILLA">Villa</option>
                    <option value="CONDOMINIUM">Condominium</option>
                    <option value="STUDIO">Studio</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Space (m²)</label>
                  <input
                    type="number"
                    min={15}
                    value={formData.sizeSqm}
                    onChange={(e) => setFormData({ ...formData, sizeSqm: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level</label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Floors</label>
                  <input
                    type="number"
                    value={formData.totalFloors}
                    onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* AI Description Generator Assistant */}
              <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-brand-900">AI Description Assistant</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDesc}
                    className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingDesc ? 'Drafting...' : 'Generate Description'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Generates an objective description based strictly on your room counts, sub-city, and amenities without fabricating unsupplied features.
                </p>
                <input
                  type="text"
                  placeholder="Optional custom owner note (e.g. Recently repainted, quiet residential street)..."
                  value={ownerNotes}
                  onChange={(e) => setOwnerNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />

                {generatedHighlights.length > 0 && (
                  <div className="pt-2 border-t border-brand-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800 block mb-1">Generated Highlights:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedHighlights.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white text-brand-900 rounded-md text-[10px] font-semibold border border-brand-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail the layout, security, natural lighting, and proximity to transport or services..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.furnished}
                    onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>This property comes fully furnished</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3">Step 2: Location Details (Addis Ababa)</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-City</label>
                  <select
                    value={formData.subCity}
                    onChange={(e) => setFormData({ ...formData, subCity: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    {ADDIS_ABABA_SUBCITIES.map((sc) => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Woreda</label>
                  <input
                    type="text"
                    placeholder="e.g. 03"
                    value={formData.woreda}
                    onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Neighborhood / Sefer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bole Atlas, near Edna Mall or Kazanchis UNECA"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Exact house numbers are kept private and shared only with confirmed renters.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PRICING & TERMS (Proclamation 1320 Compliance) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3">Step 3: Rental Terms & Legal Safeguards</h2>

              {/* AI Rental Price Assistant */}
              <div className="p-3.5 rounded-xl bg-gold-50/70 border border-gold-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-700" />
                    <span className="text-xs font-bold text-slate-900">AI Rental Price Guidance</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEstimatePrice}
                    disabled={isEstimatingPrice}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-gold-400" />
                    <span>{isEstimatingPrice ? 'Calculating...' : 'Check Market Rent'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Evaluates published listings in {formData.subCity} for comparable {formData.bedrooms}-bedroom {formData.propertyType.toLowerCase()}s.
                </p>

                {priceEstimate && (
                  <div className="mt-2 p-2.5 bg-white rounded-lg border border-gold-200/60 text-xs space-y-1">
                    {priceEstimate.isAvailable ? (
                      <>
                        <div className="flex items-baseline justify-between">
                          <span className="text-slate-600 font-medium">Suggested Market Range:</span>
                          <span className="text-sm font-bold text-slate-900">
                            {priceEstimate.suggestedMinRent.toLocaleString()} – {priceEstimate.suggestedMaxRent.toLocaleString()} ETB/mo
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Median: {priceEstimate.medianMarketRent.toLocaleString()} ETB • Confidence: {priceEstimate.confidenceScore}% (Sample: {priceEstimate.sampleSize} listings)
                        </div>
                      </>
                    ) : (
                      <div className="text-amber-800 text-[11px] font-medium">
                        {priceEstimate.disclaimer}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (ETB)</label>
                  <input
                    type="number"
                    min={1000}
                    value={formData.monthlyRent}
                    onChange={(e) => {
                      const rent = Number(e.target.value);
                      setFormData({
                        ...formData,
                        monthlyRent: rent,
                        depositAmount: Math.min(formData.depositAmount, rent * 2)
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Deposit (ETB)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-bold text-slate-900 ${
                      !isDepositValid ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 focus:ring-brand-500'
                    }`}
                  />
                </div>
              </div>

              {/* Ethiopian Rent Control Notice */}
              {!isDepositValid ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Under Proclamation No. 1320/2024, the advance deposit cannot exceed 2 months' rent (Max: {maxAllowedDeposit.toLocaleString()} ETB).
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Deposit complies with Ethiopian Rent Proclamation (≤ 2 months rent).</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Utilities Included in Rent</label>
                <div className="flex flex-wrap gap-2">
                  {['Water', 'Building Security', 'Elevator Maintenance', 'Trash Collection', 'Generator Fuel', 'WiFi'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => toggleUtility(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        formData.utilitiesIncluded.includes(u)
                          ? 'bg-brand-50 text-brand-900 border-brand-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {formData.utilitiesIncluded.includes(u) ? '✓ ' : '+ '} {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AMENITIES */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3">Step 4: Select Amenities</h2>
              <p className="text-xs text-slate-500">Highlight features that attract verified tenants in Addis Ababa.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {AMENITIES_CATALOG.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      formData.amenityIds.includes(a.id)
                        ? 'bg-brand-50 border-brand-600 text-brand-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{a.name}</span>
                    {formData.amenityIds.includes(a.id) && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: PHOTOS */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3">Step 5: High-Resolution Photos</h2>
              <p className="text-xs text-slate-500">Provide clear photographs of the living room, kitchen, bedrooms, and bathrooms.</p>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste image URL (Unsplash or direct image link)..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Photo
                </button>
              </div>

              {/* Photo Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                {formData.imageUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {formData.primaryImageIndex === idx && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-brand-800 text-white px-2 py-0.5 rounded shadow">
                        Cover Photo
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryImageIndex: idx })}
                        className="px-2 py-1 bg-white text-slate-800 rounded text-[10px] font-bold"
                      >
                        Set Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 bg-red-600 text-white rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Photo Quality Analyzer */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-slate-900">AI Photo Quality & Room Analysis</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyzePhotos}
                    disabled={isAnalyzingPhotos || formData.imageUrls.length === 0}
                    className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAnalyzingPhotos ? 'Analyzing Photos...' : 'Analyze Photos'}</span>
                  </button>
                </div>

                {photoFeedbacks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {photoFeedbacks.map((fb, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        <img src={fb.imageUrl} alt="" className="w-14 h-10 object-cover rounded-md border shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">{fb.detectedRoom || 'Room Photo'}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Score: {fb.qualityScore}/100
                            </span>
                          </div>
                          {fb.suggestions?.length > 0 && (
                            <p className="text-[10px] text-slate-600 italic">💡 {fb.suggestions[0]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: TITLE DEED VERIFICATION */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3">Step 6: Ownership Proof (Title Deed / Carta)</h2>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confidential Landlord Verification</span>
                </div>
                Your title deed (*Carta* or sub-city lease contract) is stored in an encrypted vault and is never exposed to public users or tenants. It is viewed solely by our compliance officers to award your listing the <strong>Verified Property</strong> badge.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title Deed Document URL / File</label>
                <input
                  type="text"
                  value={formData.titleDeedUrl}
                  onChange={(e) => setFormData({ ...formData, titleDeedUrl: e.target.value })}
                  placeholder="/uploads/verifications/sample_title_deed.pdf"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-slate-700"
                />
              </div>
            </div>
          )}

          {/* STEP 7: LIVE LISTING PREVIEW */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Step 7: Public Listing Preview
              </h2>
              <p className="text-xs text-slate-500">This is how your property will appear to tenants in Addis Ababa.</p>

              <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="aspect-[16/10] bg-slate-100 relative">
                  <img
                    src={formData.imageUrls[formData.primaryImageIndex] || formData.imageUrls[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow">
                      Verified Property
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-lg font-bold text-slate-900">
                      {formData.monthlyRent.toLocaleString()} ETB / mo
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase">{formData.propertyType}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{formData.title || 'Untitled Listing'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{formData.neighborhood}, {formData.subCity}</p>
                </div>
              </div>

              {/* AI Listing Quality Score Widget */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span className="font-bold text-slate-900">AI Listing Quality Analyzer</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyzeQuality}
                    disabled={isAnalyzingQuality}
                    className="px-3 py-1 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <span>{isAnalyzingQuality ? 'Evaluating...' : 'Check Completeness Score'}</span>
                  </button>
                </div>

                {qualityScore && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Listing Completeness:</span>
                      <span className={`font-black text-sm px-2 py-0.5 rounded-full ${
                        qualityScore.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {qualityScore.score}/100 ({qualityScore.grade})
                      </span>
                    </div>

                    {qualityScore.missingItems?.length > 0 && (
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                        <span className="font-bold block mb-0.5">Recommended additions:</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {qualityScore.missingItems.map((m: string, i: number) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {qualityScore.suggestions?.length > 0 && (
                      <p className="text-[11px] text-slate-600 italic">
                        💡 Tip: {qualityScore.suggestions[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 8: SUBMIT & LEGAL CONFIRMATION */}
          {currentStep === 8 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Ready to Publish on Betoch</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                By submitting this listing, you confirm you are the lawful owner or authorized property administrator under Ethiopian law. Your listing will be submitted to the Trust & Safety queue.
              </p>

              <button
                type="button"
                disabled={submitting || !isDepositValid}
                onClick={handleFinalSubmit}
                className="mt-4 px-8 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-lg shadow-brand-700/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Publishing Listing...' : 'Confirm & Publish Listing'}
              </button>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            ) : <div />}

            {currentStep < 8 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
