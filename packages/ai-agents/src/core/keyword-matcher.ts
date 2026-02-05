/**
 * Keyword Matcher
 * Handles keyword rule matching and response selection
 */

import { KeywordRule, MatchType, ResponseType } from "../types";

export class KeywordMatcher {
  private rules: Map<string, KeywordRule> = new Map();

  /**
   * Add a keyword rule
   */
  addRule(rule: KeywordRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Match keywords in a message
   */
  matchKeywords(
    message: string,
    responseType: "text" | "transfer" | "flow"
  ): KeywordRule | null {
    let bestMatch: KeywordRule | null = null;
    let bestPriority = -1;

    const rules = Array.from(this.rules.values())
      .filter((r) => r.enabled && r.responseType === responseType)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      if (this.matchesRule(message, rule)) {
        if (rule.priority > bestPriority) {
          bestMatch = rule;
          bestPriority = rule.priority;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Match flow trigger keywords
   */
  matchFlowTrigger(message: string): any | null {
    // This would typically query the database for conversation flows
    // For now, returning null
    const triggers: Record<string, any> = {
      appointment: {
        id: "appointment_flow",
        name: "Appointment Booking",
        steps: [
          {
            id: "ask_date",
            type: "question",
            content: "What date would work for you?",
          },
          {
            id: "ask_time",
            type: "question",
            content: "What time is best?",
          },
        ],
      },
    };

    for (const [trigger, flow] of Object.entries(triggers)) {
      if (message.toLowerCase().includes(trigger)) {
        return flow;
      }
    }

    return null;
  }

  /**
   * Check if message matches a keyword rule
   */
  private matchesRule(message: string, rule: KeywordRule): boolean {
    const text = rule.caseSensitive ? message : message.toLowerCase();

    for (const keyword of rule.keywords) {
      const kw = rule.caseSensitive ? keyword : keyword.toLowerCase();

      switch (rule.matchType) {
        case MatchType.EXACT:
          if (text === kw) return true;
          break;
        case MatchType.CONTAINS:
          if (text.includes(kw)) return true;
          break;
        case MatchType.STARTS_WITH:
          if (text.startsWith(kw)) return true;
          break;
        case MatchType.REGEX:
          try {
            const regex = new RegExp(kw, rule.caseSensitive ? "g" : "gi");
            if (regex.test(text)) return true;
          } catch (e) {
            // Invalid regex
          }
          break;
      }
    }

    return false;
  }
}
