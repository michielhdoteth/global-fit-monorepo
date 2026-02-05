-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('APPOINTMENT', 'PAYMENT', 'FOLLOW_UP', 'GENERAL');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'HANDOFF');

-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "plan" TEXT,
    "planDetails" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "teamId" INTEGER,
    "whatsappNumber" TEXT,
    "customField1" TEXT,
    "customField2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT,
    "duration" INTEGER,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" INTEGER NOT NULL,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "type" TEXT,
    "content" TEXT,
    "clientId" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL DEFAULT 'custom',
    "triggerEvent" TEXT NOT NULL DEFAULT 'manual',
    "templateContent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sendHour" INTEGER NOT NULL DEFAULT 9,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRuleTarget" (
    "id" SERIAL NOT NULL,
    "ruleId" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRuleTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "type" "ReminderType" NOT NULL DEFAULT 'GENERAL',
    "message" TEXT NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "sendAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "clientId" INTEGER,
    "appointmentId" INTEGER,
    "channel" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "channel" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderName" TEXT,
    "deliveryStatus" "MessageDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageMetrics" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KapsoSettings" (
    "id" SERIAL NOT NULL,
    "whatsappNumber" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "webhookSecret" TEXT,
    "baseUrl" TEXT,
    "lastHeartbeat" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KapsoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotSettings" (
    "id" SERIAL NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultResponse" TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
    "fallbackMessage" TEXT NOT NULL DEFAULT 'I''m not sure how to help with that. Please try rephrasing your question.',
    "systemPrompt" TEXT NOT NULL DEFAULT 'You are a helpful assistant for Global Fit Gym.',
    "sessionTimeoutMins" INTEGER NOT NULL DEFAULT 30,
    "businessHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "outOfHoursMessage" TEXT NOT NULL DEFAULT 'We''re currently offline. Please try again during business hours.',
    "allowAutomatedOutside" BOOLEAN NOT NULL DEFAULT false,
    "respondMessages" BOOLEAN NOT NULL DEFAULT true,
    "useKnowledgeBase" BOOLEAN NOT NULL DEFAULT true,
    "instantReply" BOOLEAN NOT NULL DEFAULT false,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" TEXT NOT NULL DEFAULT 'deepseek',
    "aiModel" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvoSettings" (
    "id" SERIAL NOT NULL,
    "dns" TEXT,
    "apiKey" TEXT,
    "aiApiKey" TEXT,
    "branchId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmSettings" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'deepseek',
    "apiKey" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-5.2-nano',
    "baseUrl" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL DEFAULT 0,
    "daysAfter" INTEGER NOT NULL DEFAULT 0,
    "templateMessage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sendHour" INTEGER NOT NULL DEFAULT 9,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleTarget" (
    "id" SERIAL NOT NULL,
    "ruleId" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationFlow" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[],
    "matchType" TEXT NOT NULL DEFAULT 'contains',
    "responseType" TEXT NOT NULL DEFAULT 'text',
    "responseContent" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvoSync" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "evoMemberId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvoSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSettings" (
    "id" SERIAL NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "backupTime" TEXT NOT NULL DEFAULT '02:00',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "lastBackupAt" TIMESTAMP(3),
    "nextScheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_clientId_idx" ON "Lead"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Campaign_clientId_idx" ON "Campaign"("clientId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "CampaignRule_ruleType_idx" ON "CampaignRule"("ruleType");

-- CreateIndex
CREATE INDEX "CampaignRule_isActive_idx" ON "CampaignRule"("isActive");

-- CreateIndex
CREATE INDEX "CampaignRuleTarget_ruleId_idx" ON "CampaignRuleTarget"("ruleId");

-- CreateIndex
CREATE INDEX "Reminder_clientId_idx" ON "Reminder"("clientId");

-- CreateIndex
CREATE INDEX "Reminder_appointmentId_idx" ON "Reminder"("appointmentId");

-- CreateIndex
CREATE INDEX "Reminder_status_idx" ON "Reminder"("status");

-- CreateIndex
CREATE INDEX "Conversation_clientId_idx" ON "Conversation"("clientId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "CheckIn_clientId_idx" ON "CheckIn"("clientId");

-- CreateIndex
CREATE INDEX "CheckIn_timestamp_idx" ON "CheckIn"("timestamp");

-- CreateIndex
CREATE INDEX "MessageMetrics_date_idx" ON "MessageMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MessageMetrics_date_key" ON "MessageMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "KapsoSettings_whatsappNumber_key" ON "KapsoSettings"("whatsappNumber");

-- CreateIndex
CREATE INDEX "RuleTarget_ruleId_idx" ON "RuleTarget"("ruleId");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE INDEX "DocumentChunk_chunkIndex_idx" ON "DocumentChunk"("chunkIndex");

-- CreateIndex
CREATE INDEX "ConversationFlow_trigger_idx" ON "ConversationFlow"("trigger");

-- CreateIndex
CREATE INDEX "KeywordRule_priority_idx" ON "KeywordRule"("priority");

-- CreateIndex
CREATE INDEX "KeywordRule_isEnabled_idx" ON "KeywordRule"("isEnabled");

-- CreateIndex
CREATE INDEX "WebhookLog_source_idx" ON "WebhookLog"("source");

-- CreateIndex
CREATE INDEX "WebhookLog_processed_idx" ON "WebhookLog"("processed");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRuleTarget" ADD CONSTRAINT "CampaignRuleTarget_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CampaignRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTarget" ADD CONSTRAINT "RuleTarget_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ReminderRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
