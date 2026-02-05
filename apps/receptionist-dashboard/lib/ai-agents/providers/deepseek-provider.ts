/**
 * DeepSeek Provider - Simplified using base class
 * Cost-effective alternative with OpenAI-compatible API
 */

import OpenAI from 'openai';
import { AIProviderConfig, GenerateResponseParams, ProviderError } from './base-provider';
import { BaseAIProvider } from './base-provider';

export class DeepSeekProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey, baseURL: 'https://api.deepseek.com' });
  }

  async generateResponse(params: GenerateResponseParams): Promise<string> {
    try {
      const startTime = Date.now();
      const enhancedPrompt = this.enhanceSystemPrompt(params.systemPrompt, params.knowledgeContext);
      const messages = this.buildMessages(params, enhancedPrompt);

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
      });

      this.logMetrics(response.usage?.total_tokens || 0, Date.now() - startTime, 'DeepSeek');
      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.handleError(error, 'DeepSeek');
      throw new ProviderError(error.message || 'Unknown error', 'DeepSeek', error.status, false);
    }
  }

  validateConfig(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.startsWith('sk-'));
  }

  getProviderName(): string {
    return 'DeepSeek';
  }

  estimateCost(tokens: number): number {
    return (tokens / 1000) * 0.0001; // DeepSeek pricing
  }
}
