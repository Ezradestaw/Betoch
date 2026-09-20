// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — OPENAI / COMPATIBLE PROVIDER
// Direct HTTPS integration without requiring external client SDKs
// ==============================================================================

import { AIProvider, AIGenerationOptions, ImageAnalysisInput } from './ai.provider.interface.js';
import { LocalRuleProvider } from './local.provider.js';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly modelName: string;
  private apiKey: string;
  private fallbackProvider: LocalRuleProvider;

  constructor(apiKey: string, modelName: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.fallbackProvider = new LocalRuleProvider();
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    if (!this.apiKey) {
      return this.fallbackProvider.generateText(prompt, options);
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1024
        }),
        signal: AbortSignal.timeout(options?.timeoutMs ?? 15000)
      });

      if (!res.ok) {
        throw new Error(`OpenAI API returned status ${res.status}`);
      }

      const data = (await res.json()) as any;
      const text = data?.choices?.[0]?.message?.content;
      return text || this.fallbackProvider.generateText(prompt, options);
    } catch {
      return this.fallbackProvider.generateText(prompt, options);
    }
  }

  async generateStructured<T>(prompt: string, schemaDescription: string, options?: AIGenerationOptions): Promise<T> {
    if (!this.apiKey) {
      return this.fallbackProvider.generateStructured<T>(prompt, schemaDescription, options);
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: `You are a strict data extraction system. Return ONLY valid JSON adhering strictly to: ${schemaDescription}`
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: options?.temperature ?? 0.1
        }),
        signal: AbortSignal.timeout(options?.timeoutMs ?? 15000)
      });

      if (!res.ok) {
        throw new Error(`OpenAI API returned status ${res.status}`);
      }

      const data = (await res.json()) as any;
      const text = data?.choices?.[0]?.message?.content;
      return JSON.parse(text) as T;
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
