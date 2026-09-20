import { z } from 'zod';
import {
  UserRole,
  IdDocumentType,
  PropertyType,
  ListingStatus,
  ApplicationStatus,
  ADDIS_ABABA_SUBCITIES,
  ETHIOPIAN_RENTAL_REGULATIONS
} from '@betoch/shared';

// ==============================================================================
// AUTHENTICATION SCHEMAS
// ==============================================================================

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  phone: z
    .string()
    .regex(/^(\+251|0)[79]\d{8}$/, 'Must be a valid Ethiopian phone number (+251 9... or 09...)')
    .transform((val) => {
      if (val.startsWith('0')) return '+251' + val.slice(1);
      return val;
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum([UserRole.RENTER, UserRole.OWNER], {
    errorMap: () => ({ message: 'Role must be either RENTER or OWNER' })
  }),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).trim()
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or phone number is required').trim(),
  password: z.string().min(1, 'Password is required')
});

export type LoginInput = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  preferredLanguage: z.enum(['en', 'am']).optional()
});

// ==============================================================================
// IDENTITY VERIFICATION SCHEMAS
// ==============================================================================

export const submitIdentityVerificationSchema = z.object({
  idType: z.nativeEnum(IdDocumentType),
  idNumber: z.string().min(4, 'ID number is required').max(32).trim(),
  documentFrontUrl: z.string().min(1, 'Front document photo is required'),
  documentBackUrl: z.string().optional()
});

export type SubmitIdentityVerificationInput = z.infer<typeof submitIdentityVerificationSchema>;

export const reviewIdentityVerificationSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'REQUIRES_INFO']),
  rejectionReason: z.string().max(500).optional()
});

// ==============================================================================
// PROPERTY SCHEMAS (Multi-step + Full Creation)
// ==============================================================================

export const createPropertyStep1Schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  propertyType: z.nativeEnum(PropertyType),
  description: z.string().min(20, 'Please provide a descriptive summary of at least 20 characters').max(3000),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().min(0.5).max(15),
  floor: z.number().int().min(-2).max(50).optional().default(0),
  totalFloors: z.number().int().min(1).max(50).optional(),
  sizeSqm: z.number().positive('Size in square meters must be positive').max(5000),
  furnished: z.boolean().default(false)
});

export const createPropertyStep2Schema = z.object({
  country: z.string().default('Ethiopia'),
  city: z.string().default('Addis Ababa'),
  subCity: z.enum(ADDIS_ABABA_SUBCITIES, {
    errorMap: () => ({ message: 'Please select a valid sub-city in Addis Ababa' })
  }),
  woreda: z.string().max(32).optional(),
  neighborhood: z.string().min(2, 'Neighborhood / Sefer name is required').max(100),
  latitudeApprox: z.number().min(8.5).max(9.5).optional(),
  longitudeApprox: z.number().min(38.5).max(39.5).optional()
});

export const createPropertyStep3BaseSchema = z.object({
  monthlyRent: z.number().positive('Monthly rent must be greater than zero'),
  depositAmount: z.number().min(0, 'Deposit cannot be negative'),
  leaseDurationMonths: z.number().int().min(ETHIOPIAN_RENTAL_REGULATIONS.MIN_LEASE_DURATION_MONTHS).default(12),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  utilitiesIncluded: z.array(z.string()).default([])
});

export const createPropertyStep3Schema = createPropertyStep3BaseSchema.refine(
  (data) => {
    // Proclamation 1320/2024 compliance: Max deposit is 2 months rent
    const maxDeposit = data.monthlyRent * ETHIOPIAN_RENTAL_REGULATIONS.MAX_DEPOSIT_MONTHS;
    return data.depositAmount <= maxDeposit;
  },
  {
    message: `According to Ethiopian Rent Control Proclamation No. 1320/2024, advance deposit cannot exceed 2 months' rent.`,
    path: ['depositAmount']
  }
);

export const propertyAmenitiesSchema = z.object({
  amenityIds: z.array(z.string()).default([])
});

export const fullPropertyCreateSchema = createPropertyStep1Schema
  .merge(createPropertyStep2Schema)
  .merge(createPropertyStep3BaseSchema)
  .merge(propertyAmenitiesSchema)
  .extend({
    imageUrls: z.array(z.string()).min(1, 'At least 1 photo is required').max(20, 'Maximum 20 photos allowed'),
    primaryImageIndex: z.number().int().min(0).default(0),
    titleDeedUrl: z.string().optional() // Ownership document for verification
  })
  .refine(
    (data) => {
      const maxDeposit = data.monthlyRent * ETHIOPIAN_RENTAL_REGULATIONS.MAX_DEPOSIT_MONTHS;
      return data.depositAmount <= maxDeposit;
    },
    {
      message: `According to Ethiopian Rent Control Proclamation No. 1320/2024, advance deposit cannot exceed 2 months' rent.`,
      path: ['depositAmount']
    }
  );

export type FullPropertyCreateInput = z.infer<typeof fullPropertyCreateSchema>;

export const propertySearchQuerySchema = z.object({
  query: z.string().optional(),
  subCity: z.string().optional(),
  neighborhood: z.string().optional(),
  propertyType: z.string().optional(),
  minRent: z.coerce.number().min(0).optional(),
  maxRent: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  furnished: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  verifiedOnly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  amenities: z.string().optional(), // comma-separated
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'size_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;

// ==============================================================================
// RENTAL APPLICATION & CONTRACT SCHEMAS
// ==============================================================================

export const submitRentalApplicationSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  proposedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  occupantsCount: z.number().int().min(1).max(20),
  message: z.string().min(10, 'Please write a short introductory note to the owner (at least 10 chars)').max(1000)
});

export type SubmitRentalApplicationInput = z.infer<typeof submitRentalApplicationSchema>;

export const updateApplicationStatusSchema = z.object({
  status: z.enum([ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]),
  reason: z.string().max(500).optional()
});

export const completeRentalSchema = z.object({
  applicationId: z.string().uuid(),
  governmentRegistrationNo: z.string().max(100).optional()
});

// ==============================================================================
// PAYMENTS & TELEBIRR SCHEMAS
// ==============================================================================

export const initiateTelebirrPaymentSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  amount: z.number().positive(),
  paymentType: z.enum(['COMMISSION', 'DEPOSIT', 'RENT'])
});

export type InitiateTelebirrPaymentInput = z.infer<typeof initiateTelebirrPaymentSchema>;

// ==============================================================================
// MESSAGING SCHEMAS
// ==============================================================================

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters').trim()
});

export const startConversationSchema = z.object({
  recipientId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  initialMessage: z.string().min(1).max(2000).trim()
});

// ==============================================================================
// REVIEWS & REPORTS SCHEMAS
// ==============================================================================

export const submitReviewSchema = z.object({
  contractId: z.string().uuid(),
  ratingAccuracy: z.number().int().min(1).max(5),
  ratingCommunication: z.number().int().min(1).max(5),
  ratingOverall: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000).trim()
});

export const submitReportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  reason: z.string().min(3).max(100),
  description: z.string().min(10, 'Please provide details for moderation').max(2000)
});

// ==============================================================================
// AI INTELLIGENCE LAYER VALIDATION SCHEMAS
// ==============================================================================

export const naturalLanguageSearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(500)
});

export type NaturalLanguageSearchInput = z.infer<typeof naturalLanguageSearchSchema>;

export const generateDescriptionSchema = z.object({
  propertyType: z.string(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0.5),
  subCity: z.string(),
  neighborhood: z.string(),
  sizeSqm: z.number().positive().optional(),
  furnished: z.boolean().default(false),
  monthlyRent: z.number().positive().optional(),
  amenities: z.array(z.string()).default([]),
  ownerNotes: z.string().max(500).optional()
});

export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;

export const analyzeQualitySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  propertyType: z.string().optional(),
  sizeSqm: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  monthlyRent: z.number().optional(),
  depositAmount: z.number().optional(),
  imageUrls: z.array(z.string()).optional(),
  amenityIds: z.array(z.string()).optional(),
  subCity: z.string().optional(),
  neighborhood: z.string().optional(),
  availableFrom: z.string().optional()
});

export type AnalyzeQualityInput = z.infer<typeof analyzeQualitySchema>;

export const estimatePriceSchema = z.object({
  subCity: z.string(),
  propertyType: z.string(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0.5).optional(),
  sizeSqm: z.number().positive().optional(),
  furnished: z.boolean().optional(),
  amenityIds: z.array(z.string()).optional()
});

export type EstimatePriceInput = z.infer<typeof estimatePriceSchema>;

export const comparePropertiesSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(2, 'Select at least 2 properties to compare').max(4, 'Maximum 4 properties can be compared')
});

export type ComparePropertiesInput = z.infer<typeof comparePropertiesSchema>;

export const userPreferencesSchema = z.object({
  budget: z.number().positive().optional(),
  subCity: z.string().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0.5).optional(),
  propertyType: z.string().optional(),
  furnished: z.boolean().optional(),
  amenities: z.array(z.string()).optional()
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

export const aiPreferenceMatchSchema = z.object({
  propertyId: z.string().uuid(),
  preferences: userPreferencesSchema
});

export const assistantChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(3000)
      })
    )
    .optional()
    .default([])
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;

export const createViewingRequestSchema = z.object({
  propertyId: z.string().uuid(),
  proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  timeSlot: z.enum(['MORNING_9_12', 'AFTERNOON_12_3', 'EVENING_3_6']),
  notes: z.string().max(500).optional()
});

export type CreateViewingRequestInput = z.infer<typeof createViewingRequestSchema>;

export const aiFeedbackSchema = z.object({
  feature: z.string(),
  resourceId: z.string().optional(),
  rating: z.enum(['POSITIVE', 'NEGATIVE']),
  comment: z.string().max(500).optional()
});

export type AiFeedbackInput = z.infer<typeof aiFeedbackSchema>;

export const toggleFeatureFlagSchema = z.object({
  featureKey: z.string(),
  isEnabled: z.boolean()
});

export type ToggleFeatureFlagInput = z.infer<typeof toggleFeatureFlagSchema>;

