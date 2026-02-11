# Global Fit WhatsApp Receptionist - Deployment Summary

**Deployment Date:** 2026-02-11

## Service Status

| Service | Status | Endpoint | Notes |
|----------|--------|----------|-------|
| WhatsApp Gateway | Running (healthy) | http://31.220.51.182:2901/qr | Ready for QR scan |
| Brain API | Removed | - | Now using OpenAI directly |
| OpenClaw | Running | http://31.220.51.182:18789 | Unused |

## Quick Start Commands

```bash
# SSH to server
ssh root@31.220.51.182

# Check container status
docker ps | grep global-fit

# View logs
docker logs global-fit-whatsapp -f

# Restart container
docker restart global-fit-whatsapp

# Stop container
docker stop global-fit-whatsapp

# Start container
cd /opt/global-fit-receptionist
docker compose -f docker-compose.global-fit.yml up -d
```

## QR Code Setup

1. Visit: http://31.220.51.182:2901/qr
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /qr` - QR code page (HTML)
- `GET /api/status` - Connection status (JSON)
- `POST /api/restart` - Restart WhatsApp (requires API key)

### Protected Endpoints (require X-API-Key header)
- `POST /api/handoff/toggle` - Toggle handoff mode
- `GET /api/handoff` - Get handoff mode status

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for responses | - |
| `CLIENT_NAME` | Business name | Global Fit |
| `API_KEY` | API authentication key | global-fit-secret-2024 |
| `TELEGRAM_BOT_TOKEN` | Optional Telegram alerts | - |
| `TELEGRAM_CHAT_ID` | Optional Telegram chat ID | - |

## Setting the OpenAI API Key

```bash
ssh root@31.220.51.182

# Edit the environment file
cd /opt/global-fit-receptionist
nano .env

# Add your key:
OPENAI_API_KEY=sk-your-openai-key-here

# Restart container
docker restart global-fit-whatsapp
```

## Business Profile

The receptionist comes pre-configured with:

- Business Name: Global Fit
- Description: Your 24/7 Fitness Center
- Welcome Message: "Welcome to Global Fit! How can I help you today?"
- Out of Hours Message: "Thank you for your message! We are currently outside of business hours..."

### Operating Hours
- Monday - Friday: 5:00 AM - 11:00 PM
- Saturday: 7:00 AM - 8:00 PM
- Sunday: 8:00 AM - 8:00 PM

### Services Mentioned
- 24/7 gym access for premium members
- Personal training sessions
- Group fitness classes
- Nutritional counseling

## Troubleshooting

### Container keeps restarting
This is normal before QR scan - WhatsApp requires authentication.
Once you scan the QR code, it will connect and stop restarting.

### View container logs
```bash
docker logs global-fit-whatsapp -f
```

### Check if WhatsApp is connected
```bash
curl http://31.220.51.182/api/status
```

Expected output when connected:
```json
{"state":"connected","handoffMode":false,"qrAvailable":false}
```

## Next Steps for Client Delivery

1. Set your OpenAI API key in the environment
2. Visit the QR page and scan with your WhatsApp business number
3. Test the receptionist by sending a message
4. Customize the business profile in gateway.js if needed

## Customization Options

You can customize:
- Business name and description
- Operating hours
- Welcome and out-of-hours messages
- Services list
- AI personality and responses

Edit these in the `BUSINESS_PROFILE` object in gateway.js around line 36.
