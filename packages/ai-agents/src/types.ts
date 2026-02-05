/**
 * AI Agent Types
 */

export enum MatchType {
  EXACT = "exact",
  CONTAINS = "contains",
  STARTS_WITH = "starts_with",
  REGEX = "regex",
}

export enum ResponseType {
  TEXT = "text",
  TRANSFER = "transfer",
  FLOW = "flow",
}

export interface KeywordRule {
  id: string;
  name: string;
  keywords: string[];
  matchType: MatchType;
  responseType: ResponseType;
  responseContent: Record<string, any>;
  priority: number;
  enabled: boolean;
  caseSensitive?: boolean;
}

export interface BusinessHours {
  enabled: boolean;
  hours: Array<{
    day: number; // 0-6
    start: string; // HH:mm
    end: string; // HH:mm
  }>;
  outOfHoursMessage: string;
  allowAutomatedOutside: boolean;
}

export interface AIConfig {
  enabled: boolean;
  provider: "openai" | "deepseek" | "anthropic";
  model: string;
  apiKey: string;
  maxTokens: number;
  systemPrompt: string;
  temperature?: number;
  useKnowledgeBase?: boolean;
}

export interface ChatbotSettings {
  isEnabled: boolean;
  defaultResponse: string;
  fallbackMessage: string;
  sessionTimeoutMins: number;
  greetingButtons: Array<{ label: string; action: string }>;
  fallbackButtons: Array<{ label: string; action: string }>;
  ai: AIConfig;
  businessHours: BusinessHours;
}

export interface ConversationFlow {
  id: string;
  name: string;
  triggers: string[];
  steps: FlowStep[];
}

export interface FlowStep {
  id: string;
  type: "question" | "message" | "transfer" | "action";
  content: string;
  options?: Array<{
    label: string;
    nextStepId: string;
  }>;
  conditions?: {
    field: string;
    operator: string;
    value: any;
  }[];
}

export interface SessionData {
  sessionId: string;
  clientId?: string;
  contactPhone?: string;
  isNewSession: boolean;
  currentFlowId?: string;
  currentStepId?: string;
  flowData: Record<string, any>;
  conversationHistory: Message[];
  createdAt: Date;
  lastActivityAt: Date;
  metadata?: Record<string, any>;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  conversationId?: string;
  sessionData?: SessionData;
  metadata?: Record<string, any>;
  error?: string;
}

export interface ConversationContext {
  conversationId: string;
  clientId: string;
  contactPhone: string;
  channel: "whatsapp" | "email" | "sms" | "web";
  sessionData: SessionData;
  history: Message[];
}
