// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — PROVIDER FACTORY
// ==============================================================================

import { config } from '@betoch/config';
import { AIProvider } from './ai.provider.interface.js';
import { LocalRuleProvider } from './local.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';

let activeProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const providerType = config.AI_PROVIDER;

  switch (providerType) {
    case 'gemini':
      activeProvider = new GeminiProvider(config.AI_API_KEY, config.AI_MODEL || 'gemini-1.5-flash');
      break;
    case 'openai':
      activeProvider = new OpenAIProvider(config.AI_API_KEY, config.AI_MODEL || 'gpt-4o-mini');
      break;
    case 'local':
    case 'mock':
    default:
      activeProvider = new LocalRuleProvider();
      break;
  }

  return activeProvider;
}

export function setAIProviderForTest(provider: AIProvider): void {
  activeProvider = provider;
}
