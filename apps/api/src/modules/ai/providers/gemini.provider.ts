// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — GOOGLE GEMINI PROVIDER
// Direct HTTPS integration without requiring external client SDKs
// ==============================================================================

import { AIProvider, AIGenerationOptions, ImageAnalysisInput } from './ai.provider.interface.js';
import { LocalRuleProvider } from './local.provider.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  readonly modelName: string;
  private apiKey: string;
  private fallbackProvider: LocalRuleProvider;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.fallbackProvider = new LocalRuleProvider();
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    if (!this.apiKey) {
      return this.fallbackProvider.generateText(prompt, options);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.2,
            maxOutputTokens: options?.maxTokens ?? 1024
          }
        }),
        signal: AbortSignal.timeout(options?.timeoutMs ?? 15000)
      });

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}`);
      }

      const data = (await res.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || this.fallbackProvider.generateText(prompt, options);
    } catch (err) {
      // Graceful fallback to deterministic local logic
      return this.fallbackProvider.generateText(prompt, options);
    }
  }

  async generateStructured<T>(prompt: string, schemaDescription: string, options?: AIGenerationOptions): Promise<T> {
    if (!this.apiKey) {
      return this.fallbackProvider.generateStructured<T>(prompt, schemaDescription, options);
    }

    const structuredPrompt = `${prompt}\n\nSTRICT INSTRUCTION: Respond ONLY with a valid, raw JSON object conforming to this schema:\n${schemaDescription}\nDo not wrap with markdown or extra conversational text.`;

    try {
      const rawText = await this.generateText(structuredPrompt, { ...options, temperature: 0.1 });
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch {
      return this.fallbackProvider.generateStructured<T>(prompt, schemaDescription, options);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.fallbackProvider.generateEmbedding(text);
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<{
    qualityScore: number;
    detectedRoom?: string;
    isTooDark: boolean;
    isBlurry: boolean;
    isScreenshot: boolean;
    suggestions: string[];
  }> {
    return this.fallbackProvider.analyzeImage(input);
  }
}
