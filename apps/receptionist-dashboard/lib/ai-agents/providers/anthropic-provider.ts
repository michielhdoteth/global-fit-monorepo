/**
 * Anthropic Provider - Simplified
 * Claude 3.5 Sonnet - High quality responses
 */

import Anthropic from '@anthropic-ai/sdk';
import { AIProviderConfig, GenerateResponseParams, BaseAIProvider, ProviderError } from './base-provider';

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async generateResponse(params: GenerateResponseParams): Promise<string> {
    try {
      const startTime = Date.now();
      const enhancedSystemPrompt = this.enhanceSystemPrompt(params.systemPrompt, params.knowledgeContext);
      const userMessages = params.messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        system: enhancedSystemPrompt,
        messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      });

      const tokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
      this.logMetrics(tokens, Date.now() - startTime, 'Anthropic');
      return response.content[0]?.type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
      this.handleError(error, 'Anthropic');
      throw new ProviderError(error.message || 'Unknown error', 'Anthropic', error.status, false);
    }
  }

  validateConfig(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.startsWith('sk-ant-'));
  }

  getProviderName(): string {
    return 'Anthropic';
  }

  estimateCost(tokens: number): number {
    return (tokens / 1000) * 0.003; // Claude 3.5 Sonnet pricing
  }
}
