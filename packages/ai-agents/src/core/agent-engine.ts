/**
 * Agent Engine
 * Main orchestrator for message processing and routing
 */

import {
  ChatbotSettings,
  SessionData,
  AgentResponse,
  Message,
} from "../types";
import { KeywordMatcher } from "./keyword-matcher";
import { FlowExecutor } from "./flow-executor";
import { ContextManager } from "./context-manager";
import { KnowledgeRetriever } from "../services/knowledge-retriever";
import { AIProviderFactory } from "../providers/provider-factory";
import { ProviderError } from "../providers/base-provider";
import { isWithinBusinessHours } from "@repo/utils";

export class AgentEngine {
  private settings: ChatbotSettings;
  private keywordMatcher: KeywordMatcher;
  private flowExecutor: FlowExecutor;
  private contextManager: ContextManager;
  private knowledgeRetriever: KnowledgeRetriever;

  constructor(settings: ChatbotSettings) {
    this.settings = settings;
    this.keywordMatcher = new KeywordMatcher();
    this.flowExecutor = new FlowExecutor();
    this.contextManager = new ContextManager();
    this.knowledgeRetriever = new KnowledgeRetriever();
  }

  /**
   * Main entry point for processing incoming messages
   */
  async processMessage(
    messageText: string,
    sessionData: SessionData
  ): Promise<AgentResponse> {
    try {
      if (!this.settings.isEnabled) {
        return {
          success: false,
          message: "Chatbot is currently disabled",
          error: "CHATBOT_DISABLED",
        };
      }

      // Check business hours
      if (!this.isWithinBusinessHours()) {
        if (!this.settings.businessHours.allowAutomatedOutside) {
          return {
            success: true,
            message: this.settings.businessHours.outOfHoursMessage,
            sessionData,
          };
        }
      }

      // Update session activity
      sessionData.lastActivityAt = new Date();

      // Check if user is in an active flow
      if (sessionData.currentFlowId) {
        return await this.processFlowResponse(messageText, sessionData);
      }

      // Check for transfer keywords
      const transferMatch = this.keywordMatcher.matchKeywords(
        messageText,
        "transfer"
      );
      if (transferMatch) {
        return {
          success: true,
          message:
            transferMatch.responseContent.body ||
            "Transferring to an agent...",
          sessionData,
          metadata: { action: "transfer" },
        };
      }

      // Check for flow trigger keywords
      const flowTrigger = this.keywordMatcher.matchFlowTrigger(messageText);
      if (flowTrigger) {
        return await this.startFlow(flowTrigger, messageText, sessionData);
      }

      // Handle greeting for new sessions
      if (sessionData.isNewSession) {
        sessionData.isNewSession = false;
        const greetingMessage = this.settings.defaultResponse;
        return {
          success: true,
          message: greetingMessage,
          sessionData,
        };
      }

      // Check for regular keyword matches
      const keywordMatch = this.keywordMatcher.matchKeywords(
        messageText,
        "text"
      );
      if (keywordMatch) {
        return {
          success: true,
          message: keywordMatch.responseContent.body || "",
          sessionData,
        };
      }

      // Try AI response if enabled
      if (this.settings.ai.enabled) {
        const aiResponse = await this.generateAIResponse(
          messageText,
          sessionData
        );
        if (aiResponse) {
          return {
            success: true,
            message: aiResponse,
            sessionData,
          };
        }
      }

      // Fallback message
      return {
        success: true,
        message: this.settings.fallbackMessage,
        sessionData,
      };
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        success: false,
        message: this.settings.fallbackMessage,
        error: "PROCESSING_ERROR",
        sessionData,
      };
    }
  }

  /**
   * Process response within a conversation flow
   */
  private async processFlowResponse(
    messageText: string,
    sessionData: SessionData
  ): Promise<AgentResponse> {
    try {
      const flowResponse = this.flowExecutor.processResponse(
        messageText,
        sessionData
      );

      if (flowResponse.completed) {
        sessionData.currentFlowId = undefined;
        sessionData.currentStepId = undefined;
        sessionData.flowData = {};

        return {
          success: true,
          message: flowResponse.message || "Thank you for your information!",
          sessionData,
          metadata: { flowCompleted: true },
        };
      }

      return {
        success: true,
        message: flowResponse.message,
        sessionData,
      };
    } catch (error) {
      console.error("Error processing flow response:", error);
      sessionData.currentFlowId = undefined;

      return {
        success: true,
        message: this.settings.fallbackMessage,
        sessionData,
      };
    }
  }

  /**
   * Start a conversation flow
   */
  private async startFlow(
    flow: any,
    userMessage: string,
    sessionData: SessionData
  ): Promise<AgentResponse> {
    sessionData.currentFlowId = flow.id;
    sessionData.currentStepId = flow.steps[0]?.id;
    sessionData.flowData = {};

    const firstMessage =
      flow.steps[0]?.content || "Please provide the following information:";

    return {
      success: true,
      message: firstMessage,
      sessionData,
      metadata: { flowStarted: true, flowId: flow.id },
    };
  }

  /**
   * Generate AI response using configured AI provider
   * Supports OpenAI, DeepSeek, and Anthropic with knowledge base RAG
   */
  private async generateAIResponse(
    messageText: string,
    sessionData: SessionData
  ): Promise<string | null> {
    try {
      const aiConfig = this.settings.ai;

      // Validate AI is enabled and configured
      if (!aiConfig.enabled) {
        console.log("[AI_ENGINE] AI is disabled");
        return null;
      }

      if (!aiConfig.apiKey) {
        console.error("[AI_ENGINE] No API key configured for", aiConfig.provider);
        return null;
      }

      // Retrieve knowledge base context if enabled
      let knowledgeContext: string[] = [];
      if (aiConfig.useKnowledgeBase) {
        console.log("[AI_ENGINE] Retrieving knowledge base context");
        knowledgeContext = await this.knowledgeRetriever.retrieve(messageText);
        if (knowledgeContext.length > 0) {
          console.log(`[AI_ENGINE] Found ${knowledgeContext.length} relevant chunks`);
        }
      }

      // Get conversation history from context manager
      const messages = this.contextManager.getMessagesForAI(
        sessionData,
        aiConfig.systemPrompt
      );

      // Add current user message to history
      messages.push({
        role: "user" as const,
        content: messageText,
      });

      // Create provider instance using factory
      const provider = AIProviderFactory.createProvider({
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        maxTokens: aiConfig.maxTokens || 1000,
        temperature: aiConfig.temperature || 0.7,
      });

      // Generate AI response
      console.log(`[AI_ENGINE] Generating response with ${provider.getProviderName()}`);
      const response = await provider.generateResponse({
        messages,
        systemPrompt: aiConfig.systemPrompt,
        maxTokens: aiConfig.maxTokens || 1000,
        temperature: aiConfig.temperature || 0.7,
        knowledgeContext,
      });

      if (!response) {
        console.error("[AI_ENGINE] Empty response from provider");
        return null;
      }

      // Add AI response to conversation context for future messages
      this.contextManager.addMessage(sessionData, "assistant", response);

      console.log("[AI_ENGINE] Response generated successfully");
      return response;
    } catch (error) {
      if (error instanceof ProviderError) {
        console.error(`[AI_ENGINE] Provider error: ${error.provider} - ${error.message}`);
      } else {
        console.error("[AI_ENGINE] Error generating AI response:", error);
      }
      return null;
    }
  }

  /**
   * Check if current time is within business hours
   */
  private isWithinBusinessHours(): boolean {
    if (!this.settings.businessHours.enabled) {
      return true;
    }

    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Convert to Monday-based

    for (const hours of this.settings.businessHours.hours) {
      if (hours.day === dayOfWeek) {
        const startHour = parseInt(hours.start.split(":")[0]);
        const startMin = parseInt(hours.start.split(":")[1]);
        const endHour = parseInt(hours.end.split(":")[0]);
        const endMin = parseInt(hours.end.split(":")[1]);

        const currentTime =
          now.getHours() * 60 + now.getMinutes();
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        return currentTime >= startTime && currentTime <= endTime;
      }
    }

    return false;
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<ChatbotSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): ChatbotSettings {
    return this.settings;
  }
}
