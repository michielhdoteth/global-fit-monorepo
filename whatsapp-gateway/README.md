# Global Fit WhatsApp Gateway

This WhatsApp gateway connects Global Fit's WhatsApp Business number to the multi-tenant NanoClaw AI receptionist.

## Quick Start

### 1. Install Dependencies

```bash
npm install @whiskeysockets/baileys pino express dotenv better-sqlite3
```

### 2. Configure Environment

Copy the example environment file and update with your values:

```bash
cp config/client-global-fit.env .env
# Edit .env with your actual values
```

Required environment variables:
- `BRAIN_API_KEY` - API key for NanoClaw Brain API
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI directly)

### 3. Start the Gateway

```bash
node gateway.js
```

The gateway will start on port `2901` (configurable).

### 4. Connect WhatsApp

1. Visit `http://localhost:2901/qr` in your browser
2. Scan the QR code with WhatsApp Business on your phone
3. Wait for connection confirmation
4. The gateway is now ready to receive and respond to messages

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Gateway HTTP port | `2901` |
| `CLIENT_ID` | Global Fit tenant ID | `global-fit` |
| `BRAIN_API_URL` | NanoClaw Brain API URL | `http://localhost:3001` |
| `BRAIN_API_KEY` | API key for Brain API | Required |
| `TENANT_ID` | Tenant ID for routing | `global-fit` |
| `SESSION_PATH` | WhatsApp session storage | `./sessions/global-fit` |
| `LOG_LEVEL` | Logging level | `info` |

### Business Profile

Global Fit's business profile is stored in the shared database and loaded automatically by NanoClaw:
- **Name:** Global Fit
- **Description:** Fitness and wellness center offering personal training, group classes, and wellness programs
- **Email:** info@globalfit.com
- **Services:** Personal Training, Group Classes, Wellness Programs, Nutrition Consulting

## API Endpoints

### Health Check
```
GET /health
Response:
{
  "status": "ok",
  "whatsapp": "connected",
  "handoffMode": false,
  "timestamp": "2024-02-10T20:00:00.000Z"
}
```

### QR Code
```
GET /qr
Returns HTML page with QR code for WhatsApp connection
```

### Status
```
GET /api/status
Response:
{
  "state": "connected",
  "handoffMode": false,
  "qrAvailable": false
}
```

### Toggle Handoff Mode
```
POST /api/handoff/toggle
Response:
{
  "handoffMode": true
}
```

### Restart Gateway
```
POST /api/restart
Response:
{
  "status": "restarted"
}
```

## Message Flow

```
Customer WhatsApp Message
  ↓
Baileys Gateway (Port 2901)
  ↓ (with X-Client-ID: global-fit header)
NanoClaw Brain API (Port 3001)
  ↓ (loads Global Fit profile)
AI Receptionist (Global Fit context)
  ↓
Generate English/Spanish response
  ↓
Gateway sends to WhatsApp Customer
```

## Business Hours

Global Fit operating hours:
- Monday - Friday: 6:00 AM - 10:00 PM
- Saturday: 8:00 AM - 8:00 PM
- Sunday: 8:00 AM - 6:00 PM

Messages received outside these hours will receive an automated out-of-hours message.

## Handoff Mode

Enable handoff mode to take over conversations manually:

```bash
curl -X POST http://localhost:2901/api/handoff/toggle
```

When handoff mode is active:
- AI will not respond automatically
- Messages are logged for review
- Human can respond via WhatsApp Business app

## Monitoring

### Check Connection Status
```bash
curl http://localhost:2901/api/status
```

### View Health
```bash
curl http://localhost:2901/health
```

### Check Brain API Health
```bash
curl http://localhost:3001/api/health/global-fit
```

## Troubleshooting

### WhatsApp Not Connecting
1. Visit `http://localhost:2901/qr` to get a new QR code
2. Scan with WhatsApp Business (not regular WhatsApp)
3. Check logs for connection errors
4. Ensure internet connectivity

### No AI Response
1. Verify Brain API is running: `curl http://localhost:3001/health`
2. Check `BRAIN_API_KEY` in `.env`
3. Check Brain API logs for errors
4. Verify tenant ID: `global-fit`

### Gateway Port Conflict
If port 2901 is already in use:
1. Stop the conflicting service
2. Or change `PORT` in `.env`
3. Update `gateway_port` in the database for this tenant

## Security

- Never commit `.env` to version control
- Use strong API keys
- Enable HTTPS in production
- Restrict API access with IP whitelisting
- Monitor logs for suspicious activity

## Development

### Running with Auto-Reload
```bash
npm install --save-dev nodemon
nodemon gateway.js
```

### Running in Background
```bash
nohup node gateway.js > gateway.log 2>&1 &
```

### Using PM2 (Production)
```bash
pm2 start gateway.js --name global-fit-gateway
pm2 logs global-fit-gateway
pm2 restart global-fit-gateway
```

## Fitness-Specific Features

### Booking Classes
The AI can handle class bookings:
- Personal training sessions
- Group classes
- Wellness programs
- Nutrition consultations

### Common Questions Handled
- Class schedules and availability
- Membership pricing
- Trainer information
- Location and hours
- Equipment availability

## Support

For Global Fit-specific issues:
- Check logs: `gateway.log` or console output
- Verify database configuration
- Test Brain API directly
- Contact 4mlabs Engineering team

## Related Documentation

- [Multi-Tenant NanoClaw Setup](../shared/README.md)
- [NanoClaw Brain API Documentation](https://github.com/4mlabs/nanoclaw)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)

---

*Last Updated: 2026-02-10*
*Client: Global Fit (info@globalfit.com)*
