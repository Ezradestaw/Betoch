// ==============================================================================
// BETOCH SHARED DOMAIN TYPES & CONSTANTS
// ==============================================================================

export enum UserRole {
  RENTER = 'RENTER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN'
}

export enum IdentityStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  REQUIRES_INFO = 'REQUIRES_INFO'
}

export enum IdDocumentType {
  FAYDA_DIGITAL_ID = 'FAYDA_DIGITAL_ID',
  KEBELE_ID = 'KEBELE_ID',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE'
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  CONDOMINIUM = 'CONDOMINIUM',
  VILLA = 'VILLA',
  STUDIO = 'STUDIO',
  TOWNHOUSE = 'TOWNHOUSE',
  GUESTHOUSE = 'GUESTHOUSE',
  ROOM = 'ROOM'
}

export enum PropertyVerificationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  RENTED = 'RENTED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED'
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED'
}

export enum RentalContractStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED'
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  DUE = 'DUE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentProviderType {
  TELEBIRR = 'TELEBIRR',
  CBE_BIRR = 'CBE_BIRR',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOCK_SANDBOX = 'MOCK_SANDBOX'
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum ReportReason {
  FAKE_LISTING = 'FAKE_LISTING',
  INCORRECT_INFORMATION = 'INCORRECT_INFORMATION',
  SUSPICIOUS_OWNER = 'SUSPICIOUS_OWNER',
  SCAM_ATTEMPT = 'SCAM_ATTEMPT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  OTHER = 'OTHER'
}

export enum ReportStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

// ------------------------------------------------------------------------------
// Ethiopian Sub-Cities & Neighborhoods
// ------------------------------------------------------------------------------

export const ADDIS_ABABA_SUBCITIES = [
  'Bole',
  'Yeka',
  'Kirkos',
  'Arada',
  'Lideta',
  'Nifas Silk-Lafto',
  'Kolfe Keranio',
  'Gullele',
  'Addis Ketema',
  'Akaki Kality',
  'Lemi Kura'
] as const;

export type AddisAbabaSubCity = (typeof ADDIS_ABABA_SUBCITIES)[number];

export const POPULAR_NEIGHBORHOODS: Record<AddisAbabaSubCity, string[]> = {
  Bole: ['Bole Medhanialem', 'Bole Atlas', 'Bole Brass', 'Gerji', 'Rwanda', 'Bole Bulbula'],
  Yeka: ['CMC', 'Megenagna', 'Kotebe', 'Ayat', 'Ferensay Legasion', 'Signal'],
  Kirkos: ['Kazanchis', 'Meskel Flower', 'Beklobet', 'Gotera', 'Olympia', 'Kirkos Sefer'],
  Arada: ['Piassa', 'Piazza Church', 'Arat Kilo', 'Sidist Kilo', 'Ras Mekonnen'],
  Lideta: ['Lideta Condominium', 'Mexico', 'Balcha', 'Tor Hailoch'],
  'Nifas Silk-Lafto': ['Sarbet', 'Bisrate Gabriel', 'Jomo', 'Lebu', 'Haile Garment', 'Mekanisa'],
  'Kolfe Keranio': ['Alem Bank', 'Keranio', 'Total', 'Ayertena'],
  Gullele: ['Shiro Meda', 'Pecan', 'Kecheni', 'Entoto'],
  'Addis Ketema': ['Merkato', 'Abinet', 'Autobus Tera', 'Sebategna'],
  'Akaki Kality': ['Kality', 'Akaki', 'Gelan Condominium', 'Tulu Dimtu'],
  'Lemi Kura': ['Summit', 'Ayat Zone 2', 'Meri Luke', 'Bole Arabsa']
};

// ------------------------------------------------------------------------------
// Standard Amenities & Utilities
// ------------------------------------------------------------------------------

export const AMENITIES_CATALOG = [
  { id: 'water_tank', name: 'Backup Water Tank', category: 'Utilities', icon: 'droplet' },
  { id: 'generator', name: 'Backup Generator', category: 'Utilities', icon: 'zap' },
  { id: 'wifi', name: 'High-Speed Internet / WiFi', category: 'Utilities', icon: 'wifi' },
  { id: 'parking', name: 'Reserved Parking Space', category: 'Building', icon: 'car' },
  { id: 'elevator', name: 'Elevator / Lift', category: 'Building', icon: 'arrow-up-down' },
  { id: 'security_guard', name: '24/7 Security Guard', category: 'Security', icon: 'shield-check' },
  { id: 'cctv', name: 'CCTV Surveillance', category: 'Security', icon: 'video' },
  { id: 'balcony', name: 'Private Balcony', category: 'Living', icon: 'sun' },
  { id: 'modern_kitchen', name: 'Modern Fitted Kitchen', category: 'Interior', icon: 'utensils' },
  { id: 'water_heater', name: 'Water Heater / Boiler', category: 'Utilities', icon: 'flame' },
  { id: 'washing_machine', name: 'Washing Machine Area', category: 'Interior', icon: 'layers' },
  { id: 'pets_allowed', name: 'Pets Allowed', category: 'Rules', icon: 'heart' }
] as const;

// ------------------------------------------------------------------------------
// Proclamation No. 1320/2024 Legal Safeguards
// ------------------------------------------------------------------------------

export const ETHIOPIAN_RENTAL_REGULATIONS = {
  MAX_DEPOSIT_MONTHS: 2,
  DEFAULT_LEASE_DURATION_MONTHS: 12,
  MIN_LEASE_DURATION_MONTHS: 6,
  CURRENCY: 'ETB',
  DEFAULT_COMMISSION_PERCENT: 10.0 // 10% of 1 month rent (landlord side)
};

// ------------------------------------------------------------------------------
// AI Intelligence Layer Types & Constants
// ------------------------------------------------------------------------------

export enum AIFeatureKey {
  AI_PROPERTY_SEARCH = 'AI_PROPERTY_SEARCH',
  AI_RECOMMENDATIONS = 'AI_RECOMMENDATIONS',
  AI_DESCRIPTION_GENERATOR = 'AI_DESCRIPTION_GENERATOR',
  AI_PHOTO_ANALYSIS = 'AI_PHOTO_ANALYSIS',
  AI_FRAUD_DETECTION = 'AI_FRAUD_DETECTION',
  AI_PRICE_ASSISTANT = 'AI_PRICE_ASSISTANT',
  AI_SUPPORT_ASSISTANT = 'AI_SUPPORT_ASSISTANT',
  AI_PROPERTY_COMPARISON = 'AI_PROPERTY_COMPARISON'
}

export enum AIRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ViewingRequestStatus {
  PENDING = 'PENDING',
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, any>;
  notifyEmail: boolean;
  notifyInApp: boolean;
  lastAlertedAt?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface MatchFactor {
  factor: string;
  matched: boolean;
  score: number; // 0 - 100
  explanation: string;
}

export interface PropertyMatchResult {
  overallScore: number; // 0 - 100
  summary: string;
  factors: MatchFactor[];
}

export interface PriceEstimateResult {
  isAvailable: boolean;
  currency: string;
  suggestedMinRent: number;
  suggestedMaxRent: number;
  medianMarketRent: number;
  confidenceScore: number; // 0 - 100
  sampleSize: number;
  influencingFactors: string[];
  disclaimer: string;
}

export interface PhotoQualityFeedback {
  imageUrl: string;
  isAcceptable: boolean;
  qualityScore: number; // 0 - 100
  detectedRoom?: string;
  isTooDark: boolean;
  isBlurry: boolean;
  isScreenshot: boolean;
  suggestions: string[];
}

export interface ListingQualityScore {
  score: number; // 0 - 100
  grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  missingItems: string[];
  suggestions: string[];
  strengths: string[];
}

export interface DuplicateDetectionAlert {
  isPotentialDuplicate: boolean;
  similarityScore: number; // 0 - 100
  matchedPropertyId?: string;
  matchedPropertyTitle?: string;
  matchedOwnerId?: string;
  reasons: string[];
}

export interface RiskSignalReport {
  overallRiskScore: number; // 0 - 100
  riskLevel: AIRiskLevel;
  requiresHumanReview: boolean;
  signals: Array<{
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export interface PropertyComparisonResult {
  properties: Array<{
    id: string;
    title: string;
    slug: string;
    subCity: string;
    neighborhood: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    sizeSqm: number;
    monthlyRent: number;
    depositAmount: number;
    furnished: boolean;
    verificationStatus: string;
    primaryImage: string | null;
    amenities: string[];
  }>;
  summaryHighlights: {
    lowestRentId: string;
    largestSizeId: string;
    mostAmenitiesId: string;
  };
  comparisonNarrative: string;
}


