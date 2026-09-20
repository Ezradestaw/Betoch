// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — IMAGE ANALYSIS SERVICE
// Evaluates listing photos for clarity, lighting, and room representation
// ==============================================================================

import { getAIProvider } from '../providers/provider.factory.js';
import { PhotoQualityFeedback } from '@betoch/shared';

export class ImageAnalysisService {
  static async analyzePhotos(imageUrls: string[]): Promise<PhotoQualityFeedback[]> {
    const provider = getAIProvider();
    const results: PhotoQualityFeedback[] = [];

    for (const url of imageUrls) {
      const analysis = await provider.analyzeImage({ imageUrl: url });
      results.push({
        imageUrl: url,
        isAcceptable: analysis.qualityScore >= 60,
        qualityScore: analysis.qualityScore,
        detectedRoom: analysis.detectedRoom,
        isTooDark: analysis.isTooDark,
        isBlurry: analysis.isBlurry,
        isScreenshot: analysis.isScreenshot,
        suggestions: analysis.suggestions
      });
    }

    return results;
  }
}
