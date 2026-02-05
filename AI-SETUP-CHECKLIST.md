# AI Receptionist Setup - Complete

## Configuration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Database (Neon)** | Connected | Project: young-king-22828857 |
| **LlmSettings** | Enabled | Provider: DeepSeek, Model: deepseek-chat, API Key: Configured |
| **ChatbotSettings** | Enabled | AI enabled, RespondMessages enabled |
| **Build** | Passing | No compilation errors |
| **AI Agent Test** | Working | Responds with real DeepSeek answers |
| **Kapso API Key** | Configured | API key set in .env.local |

## Kapso WhatsApp Configuration

### Current Status
- **Kapso Number**: 523312933034 (Sandbox - Active)
- **Webhook Token**: `global-fit-webhook-2024`
- **API Key**: Configured in .env.local

### Webhook Setup

**For LOCAL Testing (use ngrok):**
```bash
# Install ngrok if needed
bun add -g ngrok

# Run in separate terminal:
ngrok http 3000
```

Then in Kapso webhook settings:
- **Endpoint URL**: `https://<your-ngrok-url>/api/whatsapp/webhook`
- **Events**: Select "Message received"

**For PRODUCTION:**
- **Endpoint URL**: `https://<your-deployed-domain>/api/whatsapp/webhook`
- **Events**: Select "Message received"

#### 2. Restart the Server
```bash
bun run dev
```

## Testing the AI

### Test via API:
```bash
curl -X POST http://localhost:3000/api/ai/test-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, what are your gym hours?"}'
```

### Test via WhatsApp:
1. Send a message to: **523312933034**
2. The AI should respond automatically

## Quick Reference

- **Webhook Endpoint**: `/api/whatsapp/webhook`
- **AI Test Endpoint**: `/api/ai/test-chat`
- **Webhook Verify Token**: `global-fit-webhook-2024`
- **WhatsApp Number**: 523312933034
- **Kapso API Key**: Configured

## Common Issues

**Problem**: AI not responding to WhatsApp
**Solution**: Check that KAPSO_API_KEY is set in `.env.local`

**Problem**: Webhook verification fails
**Solution**: Ensure KAPSO_WEBHOOK_TOKEN matches between `.env.local` and Kapso dashboard

**Problem**: No AI response
**Solution**: Check server logs for errors, verify database LlmSettings has apiKey

## Files Modified for This Fix

1. `apps/receptionist-dashboard/app/providers.tsx` - Removed duplicate function
2. `apps/receptionist-dashboard/components/ui/ConfirmDialog.tsx` - Fixed Button import
3. `apps/receptionist-dashboard/components/ui/Toast.tsx` - Added export
4. `apps/receptionist-dashboard/app/crm/page.tsx` - Fixed state and toast usage
5. `apps/receptionist-dashboard/app/campaigns/settings/page.tsx` - Fixed toast usage
6. `apps/receptionist-dashboard/app/reminders/settings/page.tsx` - Fixed toast usage
7. `Database: LlmSettings` - Enabled with DeepSeek
8. `Database: ChatbotSettings` - Enabled AI and respondMessages
9. `.env.local` - Added Kapso API key and webhook configuration
