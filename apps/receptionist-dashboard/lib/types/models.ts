/**
 * Re-export Prisma model types
 * This allows importing types directly from @/lib/types instead of @prisma/client
 */

export type {
  Team,
  User,
  Client,
  Lead,
  Appointment,
  Campaign,
  Reminder,
  Conversation,
  Message,
  CheckIn,
  MessageMetrics,
  KapsoSettings,
  ChatbotSettings,
  ConversationFlow,
  KeywordRule,
  EvoSync,
  WebhookLog,
} from "@prisma/client";
