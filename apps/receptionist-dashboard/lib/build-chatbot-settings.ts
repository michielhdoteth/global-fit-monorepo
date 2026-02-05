/**
 * Build Chatbot Settings Helper
 * Constructs ChatbotSettings from database record with dynamic API key routing
 */

import { ChatbotSettings } from "@/lib/ai-agents";

/**
 * Get API key for the specified AI provider
 * Reads from environment variables based on provider name
 */
/**
 * Build complete ChatbotSettings object from database record
 * Applies dynamic API key selection based on configured provider
 */
export function buildChatbotSettings(
  dbSettings: any,
  llmSettings?: {
    provider?: string | null;
    apiKey?: string | null;
    model?: string | null;
    baseUrl?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    isEnabled?: boolean | null;
  }
): ChatbotSettings {
  const provider =
    (llmSettings?.provider as "openai" | "deepseek" | "anthropic") ||
    "deepseek";

  const apiKey = llmSettings?.apiKey || "";
  const model = llmSettings?.model || "deepseek-chat";
  const temperature = llmSettings?.temperature ?? 0.7;
  const maxTokens = llmSettings?.maxTokens ?? 1000;
  const enabledFallback = Boolean(llmSettings?.apiKey);

  return {
    isEnabled: enabledFallback,
    defaultResponse: dbSettings?.defaultResponse || "Hola! Como puedo ayudarte?",
    fallbackMessage: dbSettings?.fallbackMessage || "Lo siento, no entendi tu pregunta.",
    sessionTimeoutMins: dbSettings?.sessionTimeoutMins || 30,
    greetingButtons: [],
    fallbackButtons: [],
    ai: {
      enabled: enabledFallback,
      provider,
      model,
      apiKey,
      maxTokens,
      systemPrompt:
        dbSettings?.systemPrompt ||
        "You are a helpful customer service assistant for Global Fit gym.",
      temperature,
      useKnowledgeBase: dbSettings?.useKnowledgeBase || false,
    },
    businessHours: {
      enabled: dbSettings?.businessHoursEnabled || false,
      hours: [],
      outOfHoursMessage: dbSettings?.outOfHoursMessage || "Estamos cerrados.",
      allowAutomatedOutside: dbSettings?.allowAutomatedOutside || false,
    },
  };
}

/**
 * Validate that required API keys are configured for the provider
 * Useful for checking if the system is ready to use AI
 */
export function validateAIConfiguration(settings: ChatbotSettings): {
  valid: boolean;
  error?: string;
} {
  if (!settings.ai.enabled) {
    return { valid: false, error: "AI is not enabled" };
  }

  if (!settings.ai.apiKey) {
    return {
      valid: false,
      error: `API key not configured for ${settings.ai.provider}`,
    };
  }

  return { valid: true };
}

/**
 * Get available providers with their current status
 * Shows which providers have API keys configured
 */
export function getAvailableProviders(): Array<{
  name: string;
  displayName: string;
  configured: boolean;
  model: string;
}> {
  return [
    {
      name: "openai",
      displayName: "OpenAI (GPT-4o)",
      configured: !!process.env.OPENAI_API_KEY,
      model: "gpt-4o",
    },
    {
      name: "deepseek",
      displayName: "DeepSeek (Cost-Effective)",
      configured: !!process.env.DEEPSEEK_API_KEY,
      model: "deepseek-chat",
    },
    {
      name: "anthropic",
      displayName: "Anthropic (Claude)",
      configured: !!process.env.ANTHROPIC_API_KEY,
      model: "claude-3-5-sonnet-20241022",
    },
  ];
}
