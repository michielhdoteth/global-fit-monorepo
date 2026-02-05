/**
 * Shared Enums
 * Enum types used across the application
 */

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
}

export enum ClientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  CONVERTED = "CONVERTED",
  LOST = "LOST",
}

export enum AppointmentStatus {
  CONFIRMED = "CONFIRMED",
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  PAUSED = "PAUSED",
}

export enum ReminderStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export enum ReminderType {
  APPOINTMENT = "APPOINTMENT",
  PAYMENT = "PAYMENT",
  FOLLOW_UP = "FOLLOW_UP",
  GENERAL = "GENERAL",
}

export enum ConversationStatus {
  ACTIVE = "ACTIVE",
  RESOLVED = "RESOLVED",
  HANDOFF = "HANDOFF",
}

export enum MessageDeliveryStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}
