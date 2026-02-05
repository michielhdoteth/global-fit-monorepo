/**
 * Context Manager
 * Manages conversation context and history for AI
 */

import { SessionData, Message } from "../types";

export class ContextManager {
  private contextWindow = 20; // Keep last 20 messages for context

  /**
   * Get conversation context for AI
   */
  getContext(sessionData: SessionData): Message[] {
    const history = sessionData.conversationHistory || [];

    // Return recent messages within context window
    if (history.length > this.contextWindow) {
      return history.slice(-this.contextWindow);
    }

    return history;
  }

  /**
   * Add message to context
   */
  addMessage(sessionData: SessionData, role: "user" | "assistant", content: string): void {
    if (!sessionData.conversationHistory) {
      sessionData.conversationHistory = [];
    }

    sessionData.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Trim history if it exceeds window size
    if (sessionData.conversationHistory.length > this.contextWindow * 2) {
      sessionData.conversationHistory = sessionData.conversationHistory.slice(
        -this.contextWindow
      );
    }
  }

  /**
   * Clear conversation context
   */
  clearContext(sessionData: SessionData): void {
    sessionData.conversationHistory = [];
  }

  /**
   * Get context as messages array for AI API
   * @param sessionData Session data
   * @param systemPrompt Optional custom system prompt (overrides default)
   */
  getMessagesForAI(
    sessionData: SessionData,
    systemPrompt?: string
  ): Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system" as const,
        content:
          systemPrompt ||
          "You are a helpful customer service assistant for Global Fit receptionist.",
      },
    ];

    const context = this.getContext(sessionData);
    for (const msg of context) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  /**
   * Set context window size
   */
  setContextWindow(size: number): void {
    this.contextWindow = Math.max(1, Math.min(size, 100));
  }

  /**
   * Get context window size
   */
  getContextWindowSize(): number {
    return this.contextWindow;
  }
}
