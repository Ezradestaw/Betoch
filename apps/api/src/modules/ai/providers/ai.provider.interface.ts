// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — PROVIDER INTERFACE
// Modular abstraction allowing zero-downtime provider switching
// ==============================================================================

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutMs?: number;
}

export interface ImageAnalysisInput {
  imageUrl: string;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    width?: number;
    height?: number;
  };
}

export interface AIProvider {
  readonly name: string;
  readonly modelName: string;

  /**
   * Generates free-form text response given a prompt.
   */
  generateText(prompt: string, options?: AIGenerationOptions): Promise<string>;

  /**
   * Extracts or generates structured JSON adhering strictly to a requested shape.
   */
  generateStructured<T>(prompt: string, schemaDescription: string, options?: AIGenerationOptions): Promise<T>;

  /**
   * Generates a dense vector embedding for semantic search / RAG.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Evaluates an image for real estate listing quality (lighting, clarity, room type).
   */
  analyzeImage(input: ImageAnalysisInput): Promise<{
    qualityScore: number;
    detectedRoom?: string;
    isTooDark: boolean;
    isBlurry: boolean;
    isScreenshot: boolean;
    suggestions: string[];
  }>;
}
