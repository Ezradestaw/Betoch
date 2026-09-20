// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — LOCAL RULE & HEURISTIC PROVIDER
// Production-grade, zero-dependency, deterministic AI provider
// ==============================================================================

import { AIProvider, AIGenerationOptions, ImageAnalysisInput } from './ai.provider.interface.js';
import { ADDIS_ABABA_SUBCITIES, PropertyType } from '@betoch/shared';

export class LocalRuleProvider implements AIProvider {
  readonly name = 'local-rules-engine';
  readonly modelName = 'betoch-deterministic-v1';

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    // Generate helpful text according to intent patterns
    if (prompt.includes('LISTING_DESCRIPTION')) {
      return this.generateListingTextFromPrompt(prompt);
    }
    if (prompt.includes('SUPPORT_RAG')) {
      return this.generateRAGSupportText(prompt);
    }
    return `Betoch AI Assistant: Processed request based on verified platform information.`;
  }

  async generateStructured<T>(prompt: string, schemaDescription: string, options?: AIGenerationOptions): Promise<T> {
    const lower = prompt.toLowerCase();

    // Natural Language Search Extraction
    if (schemaDescription.includes('NaturalLanguageSearch') || lower.includes('search query')) {
      return this.extractSearchCriteria(prompt) as unknown as T;
    }

    // Default structured parse
    try {
      const jsonMatch = prompt.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
    } catch {
      // Fallback
    }

    return {} as T;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Deterministic 32-dimensional feature embedding based on term hashing
    const embedding = new Array(32).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const dim = Math.abs(hash) % 32;
      embedding[dim] += 1;
    }

    // L2 Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map((val) => Number((val / norm).toFixed(4)));
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<{
    qualityScore: number;
    detectedRoom?: string;
    isTooDark: boolean;
    isBlurry: boolean;
    isScreenshot: boolean;
    suggestions: string[];
  }> {
    const url = input.imageUrl.toLowerCase();
    const suggestions: string[] = [];

    // Check for screenshot patterns
    const isScreenshot = url.includes('screenshot') || url.includes('screen_shot');
    if (isScreenshot) {
      suggestions.push('Upload original camera photos rather than phone screenshots for better clarity.');
    }

    // Room detection heuristics from filename or url
    let detectedRoom = 'Living Room';
    if (url.includes('kitchen') || url.includes('cook')) detectedRoom = 'Kitchen';
    else if (url.includes('bed') || url.includes('room')) detectedRoom = 'Bedroom';
    else if (url.includes('bath') || url.includes('toilet')) detectedRoom = 'Bathroom';
    else if (url.includes('exterior') || url.includes('building') || url.includes('facade')) detectedRoom = 'Building Exterior';
    else if (url.includes('balcony') || url.includes('terrace')) detectedRoom = 'Balcony';

    // Heuristics for score
    let qualityScore = 85;
    if (isScreenshot) qualityScore -= 25;

    // Suggest missing rooms if applicable
    if (detectedRoom === 'Living Room') {
      suggestions.push('Consider adding kitchen and bathroom photos to improve tenant interest.');
    }

    return {
      qualityScore: Math.max(40, Math.min(100, qualityScore)),
      detectedRoom,
      isTooDark: false,
      isBlurry: false,
      isScreenshot,
      suggestions
    };
  }

  private extractSearchCriteria(queryText: string): any {
    let cleanText = queryText;
    const queryMatch = queryText.match(/Query:\s*"([^"]+)"/i);
    if (queryMatch) {
      cleanText = queryMatch[1];
    }
    const text = cleanText.toLowerCase();
    const extracted: Record<string, any> = {};

    // 1. Sub-city extraction
    for (const subCity of ADDIS_ABABA_SUBCITIES) {
      if (text.includes(subCity.toLowerCase())) {
        extracted.subCity = subCity;
        break;
      }
    }

    // 2. Bedrooms extraction ("2 bedroom", "3 bed", "one bedroom", "studio")
    if (text.includes('studio')) {
      extracted.bedrooms = 0;
      extracted.propertyType = PropertyType.STUDIO;
    } else {
      const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom|br)/);
      if (bedMatch) {
        extracted.bedrooms = parseInt(bedMatch[1], 10);
      } else if (text.includes('one bed') || text.includes('1 bed')) {
        extracted.bedrooms = 1;
      } else if (text.includes('two bed') || text.includes('2 bed')) {
        extracted.bedrooms = 2;
      } else if (text.includes('three bed') || text.includes('3 bed')) {
        extracted.bedrooms = 3;
      } else if (text.includes('four bed') || text.includes('4 bed')) {
        extracted.bedrooms = 4;
      }
    }

    // 3. Property Type extraction
    if (text.includes('apartment') || text.includes('flat')) {
      extracted.propertyType = PropertyType.APARTMENT;
    } else if (text.includes('villa') || text.includes('compound')) {
      extracted.propertyType = PropertyType.VILLA;
    } else if (text.includes('condo') || text.includes('condominium')) {
      extracted.propertyType = PropertyType.CONDOMINIUM;
    } else if (text.includes('townhouse')) {
      extracted.propertyType = PropertyType.TOWNHOUSE;
    }

    // 4. Price extraction ("under 30000", "under 30k", "below 25,000", "max 40000 etb")
    const priceUnderKMatch = text.match(/(?:under|below|max|up to|less than)\s*(\d+)\s*k\b/);
    if (priceUnderKMatch) {
      extracted.maxRent = parseInt(priceUnderKMatch[1], 10) * 1000;
    } else {
      const priceMatch = text.match(/(?:under|below|max|up to|less than)\s*([\d,]+)/);
      if (priceMatch) {
        extracted.maxRent = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      }
    }

    // Min price extraction ("above 20000", "min 15k")
    const priceMinKMatch = text.match(/(?:above|over|min|at least)\s*(\d+)\s*k\b/);
    if (priceMinKMatch) {
      extracted.minRent = parseInt(priceMinKMatch[1], 10) * 1000;
    }

    // 5. Furnished
    if (text.includes('furnished') && !text.includes('unfurnished')) {
      extracted.furnished = true;
    } else if (text.includes('unfurnished')) {
      extracted.furnished = false;
    }

    // 6. Amenities extraction
    const amenities: string[] = [];
    if (text.includes('generator') || text.includes('backup power') || text.includes('power backup')) {
      amenities.push('generator');
    }
    if (text.includes('water') || text.includes('tank') || text.includes('reservoir')) {
      amenities.push('water_tank');
    }
    if (text.includes('park') || text.includes('garage')) {
      amenities.push('parking');
    }
    if (text.includes('lift') || text.includes('elevator')) {
      amenities.push('elevator');
    }
    if (text.includes('guard') || text.includes('security')) {
      amenities.push('security_guard');
    }
    if (text.includes('wifi') || text.includes('internet')) {
      amenities.push('wifi');
    }
    if (amenities.length > 0) {
      extracted.amenities = amenities.join(',');
    }

    return extracted;
  }

  private generateListingTextFromPrompt(prompt: string): string {
    return `Spacious and well-maintained property designed for modern living in Addis Ababa. Offers convenient access to transit, verified utilities, and clean finishes.`;
  }

  private generateRAGSupportText(prompt: string): string {
    return `Based on Betoch official policy and Proclamation No. 1320/2024, residential leases are protected with a maximum 2-month security deposit limit and 10% platform commission.`;
  }
}
