# WhatsApp Webhook Integration - Complete Setup Guide

## Overview

The WhatsApp webhook integration enables automated AI-powered responses to incoming WhatsApp messages through the Kapso Platform. When a customer sends a message, the system:

1. Receives the message via webhook
2. Generates an AI response using configured provider (OpenAI, DeepSeek, or Anthropic)
3. Sends the response back to the customer via WhatsApp
4. Stores full conversation history in the database

## Architecture

```
Customer sends WhatsApp message
    ↓
Kapso Platform receives message
    ↓
POST /api/whatsapp/webhook
    ↓
├─ Store incoming message
├─ Check if AI is enabled
├─ Load conversation history
├─ Generate AI response with AgentEngine
├─ Store AI response
├─ Send response via Kapso API
└─ Update delivery status
    ↓
Customer receives AI-generated response
```

## Files Involved

### New Files
- **`lib/kapso-api.ts`** - Kapso API client for sending WhatsApp messages
- **`lib/build-chatbot-settings.ts`** - Helper to construct ChatbotSettings with dynamic API key routing

### Modified Files
- **`app/api/whatsapp/webhook/route.ts`** - Updated to trigger AI responses
- **`app/api/ai/test-chat/route.ts`** - Now uses real AI (test endpoint)
- **`app/api/ai/chat/route.ts`** - Production chat with dynamic provider routing

### Supporting Files
- **`packages/ai-agents/src/providers/`** - Three AI provider implementations
- **`packages/ai-agents/src/core/agent-engine.ts`** - Real AI response generation
- **`packages/database/schema.prisma`** - DocumentChunk model for knowledge base

## Environment Configuration

### Required Environment Variables

```bash
# Kapso API
KAPSO_API_KEY=your-kapso-api-key
KAPSO_WEBHOOK_TOKEN=your-webhook-verification-token

# AI Providers (all required for full functionality)
OPENAI_API_KEY=sk-proj-...
DEEPSEEK_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://dashboard.example.com
NEXTAUTH_SECRET=your-secret
```

### Where to Get API Keys

1. **Kapso API Key**
   - Login to Kapso Dashboard: https://dashboard.kapso.io
   - Navigate to Settings → API Keys
   - Create new API key and copy

2. **Webhook Token**
   - Generate a secure random token (e.g., `openssl rand -hex 32`)
   - Configure in Kapso Dashboard under Webhook Settings
   - Use same token in `KAPSO_WEBHOOK_TOKEN`

3. **AI Provider Keys**
   - **OpenAI**: https://platform.openai.com/api-keys
   - **DeepSeek**: https://platform.deepseek.com
   - **Anthropic**: https://console.anthropic.com

## Webhook Configuration in Kapso Platform

### Setup Steps

1. **Configure Webhook URL**
   - Go to Kapso Dashboard → Webhooks
   - Set webhook URL: `https://your-domain.com/api/whatsapp/webhook`
   - Method: POST
   - Include headers: None (API key in body)

2. **Set Verification Token**
   - Token: `KAPSO_WEBHOOK_TOKEN` value
   - This is used in the GET request to verify webhook ownership

3. **Enable Events**
   - Check: `message.received`
   - Check: `message.delivered` (optional)
   - Check: `message.failed` (optional)

4. **Test Webhook**
   - Kapso provides a "Send Test" button
   - Verify your endpoint responds with HTTP 200
   - Check logs for successful processing

## Database Setup

### Migration

When deploying to production, run:

```bash
cd packages/database
bun prisma migrate deploy
bun prisma generate
```

This creates the `DocumentChunk` table for knowledge base RAG.

### Schema Changes

New table added:
```sql
CREATE TABLE "DocumentChunk" (
  "id" SERIAL PRIMARY KEY,
  "documentId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"(id) ON DELETE CASCADE,
  INDEX idx_documentId ("documentId"),
  INDEX idx_chunkIndex ("chunkIndex")
);
```

## Webhook Flow Details

### 1. Message Receipt

```
POST /api/whatsapp/webhook
{
  "messages": [{
    "from": "528334430060",
    "text": { "body": "Hola, cuales son tus horarios?" },
    "id": "wamid.xxx",
    "timestamp": "1234567890"
  }]
}
```

### 2. Conversation Lookup

- Searches database for existing conversation
- Creates new Client + Conversation if first message from number
- Links all messages by phone number

### 3. AI Response Generation

```typescript
// Build settings from database
const settings = buildChatbotSettings(dbSettings);

// Load conversation history (last 20 messages)
const history = await prisma.message.findMany({...});

// Create session with context
const sessionData = { conversationHistory: [...] };

// Generate response using AgentEngine
const response = await agent.processMessage(message, sessionData);
```

### 4. Message Storage & Delivery

```typescript
// Store AI response
const aiMessage = await prisma.message.create({
  conversationId: conversation.id,
  content: response.message,
  sender: "agent",
  deliveryStatus: "PENDING"
});

// Send via Kapso
const result = await sendWhatsAppMessage(from, response.message);

// Update status
if (result.success) {
  await prisma.message.update({
    where: { id: aiMessage.id },
    data: { deliveryStatus: "DELIVERED", messageId: result.message_id }
  });
}
```

## Configuration via Dashboard

Users can control AI behavior from the `/ai-agent` settings page:

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Chatbot Enabled | Boolean | false | Enable/disable automation |
| AI Enabled | Boolean | false | Enable/disable AI responses |
| AI Provider | Enum | deepseek | OpenAI, DeepSeek, or Anthropic |
| AI Model | String | deepseek-chat | Model name for provider |
| System Prompt | Text | "You are a..." | Custom AI behavior |
| Use Knowledge Base | Boolean | false | Include document context |
| Business Hours | Boolean | false | Only respond during hours |
| Session Timeout | Number | 30 | Minutes before session resets |

## Error Handling

### Graceful Degradation

The webhook is designed to handle errors gracefully:

```typescript
// If AI disabled → Don't generate response
if (!settings.aiEnabled) {
  return { processed: true };
}

// If API key missing → Don't generate response
if (!chatbotSettings.ai.apiKey) {
  return { processed: true };
}

// If AI fails → Message still stored, no response sent
try {
  const response = await agent.processMessage(...);
} catch (error) {
  console.error("AI generation failed:", error);
  return { processed: true }; // Still acknowledge receipt
}

// If send fails → Mark as FAILED, human review available
if (!sendResult.success) {
  await prisma.message.update({
    data: { deliveryStatus: "FAILED" }
  });
}
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Messages received but no response | AI disabled in settings | Enable AI in `/ai-agent` settings |
| "API key not configured" | Missing env variable | Set DEEPSEEK_API_KEY (or other provider) |
| 401 Unauthorized | Invalid Kapso API key | Verify KAPSO_API_KEY in Kapso dashboard |
| Webhook verification fails | Wrong token | Ensure KAPSO_WEBHOOK_TOKEN matches |
| Rate limit errors | Too many API calls | Implement queue/throttling (future enhancement) |

## Logging & Monitoring

### Log Prefix: `[WHATSAPP_WEBHOOK]`

Log messages include:
```
[WHATSAPP_WEBHOOK] Received message from 528334430060
[WHATSAPP_WEBHOOK] Created new conversation for 528334430060
[WHATSAPP_WEBHOOK] Stored incoming message
[WHATSAPP_WEBHOOK] Generating AI response with deepseek
[WHATSAPP_WEBHOOK] Stored AI response: "Hola, nuestros horarios son..."
[WHATSAPP_WEBHOOK] Sending message to 528334430060
[WHATSAPP_WEBHOOK] Message sent successfully: wamid.xxx
```

### Monitoring Dashboard

Track metrics in the `MessageMetrics` table:
- `totalSent` - Total messages sent
- `delivered` - Successfully delivered
- `failed` - Failed delivery attempts

Query example:
```sql
SELECT * FROM "MessageMetrics"
WHERE date = CURRENT_DATE
ORDER BY date DESC;
```

## Testing

### Test via cURL

```bash
# Test chat endpoint
curl -X POST http://localhost:3002/api/ai/test-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, cuales son tus horarios?"}'

# Expected response:
{
  "message": "AI-generated response here",
  "configured": true,
  "aiEnabled": true,
  "provider": "deepseek",
  "model": "deepseek-chat"
}
```

### Test Webhook Verification

```bash
# GET request to verify webhook
curl -X GET "http://localhost:3002/api/whatsapp/webhook?hub.verify_token=YOUR_TOKEN&hub.challenge=test_challenge"

# Expected response: 200 OK
```

### Test Message Sending

```bash
# Send test message
curl -X POST http://localhost:3002/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "from": "+528334430060",
      "text": { "body": "Hola" },
      "id": "msg_123",
      "timestamp": "1234567890"
    }]
  }'

# Check logs for [WHATSAPP_WEBHOOK] entries
# Check database for new messages
```

## Performance Considerations

### Response Time
- Message receipt: ~100ms
- AI generation: 1-5 seconds (depends on provider)
- Message sending: ~500ms-2s
- **Total: 1.5-7 seconds** (acceptable for async notification)

### Database Queries
- 1 query to find conversation
- 1 query to create client (if new)
- 1 query to create conversation (if new)
- 1 query to store incoming message
- 1 query to load history (20 messages)
- 1 query to create AI response
- 1 query to update delivery status
- **Total: 7-8 queries per message**

### Optimization Opportunities
1. Cache conversation lookups (Redis)
2. Batch database operations
3. Use provider fallback chain
4. Implement message queue for large volumes

## Security

### API Key Management
- All API keys stored as environment variables
- Never exposed in logs (redaction)
- Rotatable via environment update

### Webhook Verification
- Token-based verification on GET request
- HTTPS required in production
- Rate limiting recommended (future)

### Data Privacy
- Phone numbers stored with customer consent
- Messages stored for conversation history
- GDPR-compliant data retention (configure as needed)

## Troubleshooting

### Check Webhook Receiving

```sql
-- View recent messages
SELECT * FROM "Message"
WHERE sender = 'client'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check AI Response Generation

```sql
-- View AI responses
SELECT * FROM "Message"
WHERE sender = 'agent'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### View Delivery Status

```sql
-- Check delivery failures
SELECT * FROM "Message"
WHERE "deliveryStatus" = 'FAILED'
ORDER BY "createdAt" DESC;
```

### Enable Debug Logging

Add to your code:
```typescript
if (process.env.DEBUG_WEBHOOK === 'true') {
  console.log('[WEBHOOK_DEBUG]', payload);
}
```

## Deployment Checklist

- [ ] Environment variables configured (KAPSO_API_KEY, KAPSO_WEBHOOK_TOKEN, AI keys)
- [ ] Database migrations applied (prisma migrate deploy)
- [ ] Webhook URL configured in Kapso dashboard
- [ ] Webhook token matches KAPSO_WEBHOOK_TOKEN
- [ ] Chatbot settings created in database
- [ ] AI enabled in settings
- [ ] Provider configured and tested
- [ ] Webhook verification test passed (GET request)
- [ ] Test message sent and received
- [ ] Logs verified for successful processing
- [ ] Monitoring dashboard configured
- [ ] Error alerts configured

## Support & Troubleshooting

For issues:
1. Check logs with `[WHATSAPP_WEBHOOK]` prefix
2. Verify environment variables are set
3. Test with `/api/ai/test-chat` endpoint
4. Check database for message storage
5. Review Kapso API status: https://status.kapso.io

## Future Enhancements

- [ ] Message queue for high volume
- [ ] Redis caching for conversations
- [ ] Provider fallback chain
- [ ] Batch sending support
- [ ] Media attachment support
- [ ] Interactive message support (buttons)
- [ ] Read receipts tracking
- [ ] Typing indicators
- [ ] Multi-language detection
- [ ] Sentiment analysis
- [ ] Conversation export
