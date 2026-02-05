/**
 * AI Provider Factory
 * Dynamically creates and manages AI provider instances
 * Implements singleton pattern with caching
 */

import { AIProvider, AIProviderConfig, GenerateResponseParams, ProviderError } from './base-provider';
import { OpenAIProvider } from './openai-provider';
import { DeepSeekProvider } from './deepseek-provider';
import { AnthropicProvider } from './anthropic-provider';

export class AIProviderFactory {
  private static instances: Map<string, AIProvider> = new Map();

  /**
   * Create or retrieve a cached provider instance
   * @param config Provider configuration
   * @returns Provider instance
   * @throws ProviderError if config is invalid
   */
  static createProvider(config: AIProviderConfig): AIProvider {
    // Create cache key from provider and model
    const cacheKey = `${config.provider}-${config.model}`;

    // Return cached instance if exists
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    // Create new provider instance based on type
    let provider: AIProvider;

    switch (config.provider) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;

      case 'deepseek':
        provider = new DeepSeekProvider(config);
        break;

      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;

      default:
        throw new ProviderError(
          `Unsupported provider: ${config.provider}`,
          'factory',
          undefined,
          false
        );
    }

    // Validate configuration before caching
    if (!provider.validateConfig()) {
      throw new ProviderError(
        `Invalid configuration for ${provider.getProviderName()}`,
        config.provider,
        undefined,
        false
      );
    }

    // Cache and return
    this.instances.set(cacheKey, provider);
    console.log(`[PROVIDER_FACTORY] Created ${provider.getProviderName()} instance (${config.model})`);
    return provider;
  }

  /**
   * Clear provider cache (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
    console.log('[PROVIDER_FACTORY] Cache cleared');
  }

  /**
   * Generate response with fallback to alternative providers
   * Tries each config in order until one succeeds
   * @param configs Array of provider configs to try in order
   * @param params Generation parameters
   * @returns AI response text
   * @throws ProviderError if all providers fail
   */
  static async generateWithFallback(
    configs: AIProviderConfig[],
    params: GenerateResponseParams
  ): Promise<string> {
    if (!configs || configs.length === 0) {
      throw new ProviderError(
        'No provider configurations provided',
        'factory',
        undefined,
        false
      );
    }

    const errors: Array<{ provider: string; error: Error }> = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      try {
        const provider = this.createProvider(config);
        console.log(`[PROVIDER_FALLBACK] Attempting ${provider.getProviderName()} (${i + 1}/${configs.length})`);
        const response = await provider.generateResponse(params);
        console.log(`[PROVIDER_FALLBACK] Success with ${provider.getProviderName()}`);
        return response;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ provider: config.provider, error: error as Error });
        console.log(
          `[PROVIDER_FALLBACK] ${config.provider} failed (${i + 1}/${configs.length}): ${errorMsg}`
        );

        // If non-retryable error, throw immediately
        if (error instanceof ProviderError && !error.retryable) {
          throw error;
        }

        // Try next provider
        if (i < configs.length - 1) {
          continue;
        }
      }
    }

    // All providers failed
    const errorSummary = errors.map(e => `${e.provider}: ${e.error.message}`).join('; ');
    throw new ProviderError(
      `All providers failed. ${errorSummary}`,
      'factory',
      undefined,
      false
    );
  }

  /**
   * Get the best provider config to use based on settings
   * Returns primary and fallback providers in order
   */
  static getBestProviderConfigs(
    primaryConfig: AIProviderConfig,
    fallbackProviders?: AIProviderConfig[]
  ): AIProviderConfig[] {
    const configs = [primaryConfig];

    // Add fallback providers if specified
    if (fallbackProviders && fallbackProviders.length > 0) {
      configs.push(...fallbackProviders);
    }

    return configs;
  }
}
