// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — MASTER AISERVICE FACADE
// Unified entry point for all platform AI operations
// ==============================================================================

import { PropertySearchService } from './services/property-search.service.js';
import { PropertyMatchingService } from './services/property-matching.service.js';
import { RecommendationService } from './services/recommendation.service.js';
import { ListingDescriptionService } from './services/listing-description.service.js';
import { ListingQualityService } from './services/listing-quality.service.js';
import { PriceRecommendationService } from './services/price-recommendation.service.js';
import { ImageAnalysisService } from './services/image-analysis.service.js';
import { DuplicateDetectionService } from './services/duplicate-detection.service.js';
import { FraudDetectionService } from './services/fraud-detection.service.js';
import { PropertyComparisonService } from './services/property-comparison.service.js';
import { SupportAssistantService } from './services/support-assistant.service.js';
import { RentalAssistantService } from './services/rental-assistant.service.js';
import { FeatureFlagsService } from './services/feature-flags.service.js';
import { AIObservabilityService } from './services/ai-observability.service.js';

export const AIService = {
  search: PropertySearchService,
  matching: PropertyMatchingService,
  recommendations: RecommendationService,
  description: ListingDescriptionService,
  quality: ListingQualityService,
  pricing: PriceRecommendationService,
  images: ImageAnalysisService,
  duplicates: DuplicateDetectionService,
  fraud: FraudDetectionService,
  comparison: PropertyComparisonService,
  support: SupportAssistantService,
  assistant: RentalAssistantService,
  featureFlags: FeatureFlagsService,
  observability: AIObservabilityService
};
