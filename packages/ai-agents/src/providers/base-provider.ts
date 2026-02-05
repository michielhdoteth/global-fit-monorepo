/**
 * Base Provider Interface
 * Defines the contract all AI providers must implement
 */

export interface AIProviderConfig {
  provider: 'openai' | 'deepseek' | 'anthropic';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface GenerateResponseParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  knowledgeContext?: string[];
}

export interface AIProvider {
  generateResponse(params: GenerateResponseParams): Promise<string>;
  validateConfig(): boolean;
  getProviderName(): string;
  estimateCost(tokens: number): number;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

// ============== BASE PROVIDER WITH SHARED LOGIC ==============

export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  protected enhanceSystemPrompt(systemPrompt: string, knowledgeContext?: string[]): string {
    if (!knowledgeContext?.length) return systemPrompt;
    return `${systemPrompt}\n\nRelevant knowledge base information:\n${knowledgeContext.join('\n\n')}`;
  }

  protected buildMessages(params: GenerateResponseParams, enhancedSystemPrompt: string) {
    return [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...params.messages.filter(m => m.role !== 'system'),
    ];
  }

  protected handleError(error: any, provider: string): never {
    if (error.status === 429) throw new ProviderError('Rate limit exceeded', provider, 429, true);
    if (error.status === 401) throw new ProviderError('Invalid API key', provider, 401, false);
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new ProviderError('Request timeout', provider, undefined, true);
    }
    throw new ProviderError(error.message || 'Unknown error', provider, error.status, false);
  }

  protected logMetrics(tokens: number, duration: number, provider: string) {
    console.log('[AI_PROVIDER]', { provider, model: this.config.model, tokens, duration: `${duration}ms`, cost: this.estimateCost(tokens) });
  }

  abstract generateResponse(params: GenerateResponseParams): Promise<string>;
  abstract validateConfig(): boolean;
  abstract getProviderName(): string;
  abstract estimateCost(tokens: number): number;
}
