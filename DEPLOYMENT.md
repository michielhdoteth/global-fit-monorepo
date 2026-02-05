# Global Fit - Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Copy `.env.example` to `.env.production` and configure all required values:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:...@ep-...-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://dashboard.globalfit.com.mx"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
AUTH_SECRET="$(openssl rand -base64 32)"

# AI Providers (at least one required for AI features)
OPENAI_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# WhatsApp (Kapso) - Required for WhatsApp features
KAPSO_API_KEY="your-kapso-api-key"
KAPSO_WEBHOOK_TOKEN="$(openssl rand -base64 32)"
WHATSAPP_PROVIDER="kapso"

# Email (Resend) - Required for email notifications
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@globalfit.com.mx"

# Cron Jobs
CRON_SECRET="$(openssl rand -base64 32)"

# Site Configuration
NEXT_PUBLIC_WHATSAPP_PHONE="528334430060"
NEXT_PUBLIC_SITE_URL="https://dashboard.globalfit.com.mx"
NEXT_PUBLIC_SITE_NAME="Global Fit - Admin Dashboard"
```

### 2. Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Run migrations (creates tables with proper schema)
bun run db:migrate deploy

# Seed production data (sample clients, appointments, campaigns)
bun run db:seed
```

### 3. Build for Production

```bash
# Build all apps in the monorepo
bun run build

# Test production build locally
NODE_ENV=production bun run start
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 5. Configure Kapso Webhook

1. In Kapso Dashboard → Webhooks → Add Webhook
2. URL: `https://dashboard.globalfit.com.mx/api/whatsapp/webhook`
3. Token: Use the `KAPSO_WEBHOOK_TOKEN` from `.env.production`
4. Events to enable:
   - `message.received` - Incoming messages
   - `message.delivered` - Delivery confirmations
   - `message.failed` - Failed delivery notifications

### 6. Configure Vercel Cron Jobs

The following cron jobs are configured in `vercel.json`:

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| `*/15 * * * *` | `POST /api/cron/reminders` | Send pending reminders |
| `0 9 * * *` | `POST /api/cron/campaigns` | Activate scheduled campaigns |
| `0 * * * *` | `POST /api/cron?task=sync-checkins` | Sync check-in data |

Include header `x-cron-secret: $CRON_SECRET` if configured.

## Post-Deployment Verification

### Health Check
```bash
curl https://dashboard.globalfit.com.mx/api/health
```

### Test WhatsApp Webhook
```bash
curl -X POST https://dashboard.globalfit.com.mx/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-cron-secret" \
  -d '{"messages":[{"from":"528334430060","text":{"body":"Hola"}}]}'
```

### Test AI Chatbot
1. Send WhatsApp message to configured number
2. Check dashboard `/chats` page for conversation
3. Verify AI response was generated

### Test Email Sending
```bash
curl -X POST https://dashboard.globalfit.com.mx/api/reminders \
  -H "Authorization: Bearer your-token" \
  -d '{"client_id":1,"type":"appointment","message":"Test reminder"}'
```

## Rollback Plan

### Database Rollback
```bash
bun run db:migrate rollback
```

### Previous Deployment
```bash
vercel rollback
```

### Database Restore
```bash
# From Neon dashboard or pg_dump
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

## Monitoring

| Service | Purpose | URL |
|---------|---------|-----|
| Vercel Dashboard | Deployment logs, performance | vercel.com/dashboard |
| Neon Dashboard | Database connections, queries | console.neon.tech |
| Kapso Dashboard | WhatsApp message delivery | app.kapso.io |
| Resend Dashboard | Email deliverability | resend.com/dashboard |

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
bun install
bun run build
```

### Database Connection Failed
- Check `DATABASE_URL` format is correct
- Verify IP whitelist in Neon dashboard
- Ensure SSL mode is `require` in connection string
- Check connection pool limits in Neon

### WhatsApp Not Working
- Verify `KAPSO_API_KEY` is correct and active
- Check webhook URL is publicly accessible
- Review Kapso dashboard for error logs
- Verify phone number is connected in Kapso

### Emails Not Sending
- Verify `RESEND_API_KEY` is valid and not rate-limited
- Check `RESEND_FROM_EMAIL` domain is verified in Resend
- Review Resend API response for specific errors
- Check spam folder for delivered emails

### AI Chatbot Not Responding
- Verify at least one AI provider key is configured
- Check `/settings/ai-agent` page for configuration
- Review chatbot settings are enabled
- Check OpenAI/DeepSeek API quotas

## Integrations Summary

| Feature | Provider | Required |
|---------|----------|----------|
| WhatsApp Messaging | Kapso | Yes |
| Email Notifications | Resend | Yes (for email features) |
| AI Chatbot | OpenAI/DeepSeek/Anthropic | Yes (at least one) |
| Database | Neon PostgreSQL | Yes |
| Authentication | NextAuth v5 | Yes |

## Quick Commands Reference

```bash
# Development
bun run dev

# Build
bun run build

# Database
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run migrations
bun run db:push      # Push schema (development only)
bun run db:seed      # Seed sample data

# Production
NODE_ENV=production bun run start

# Cleanup
bun run clean        # Clean build artifacts
rm -rf node_modules  # Remove dependencies
```
