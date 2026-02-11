# Fusion Galeria Client

Dedicated NanoClaw AI Receptionist and WhatsApp Gateway for Fusion Galeria.

## Architecture

This is an isolated client deployment with:
- **NanoClaw** (port 3001): AI-powered receptionist
- **WhatsApp Gateway** (port 3101): Baileys instance
- **SQLite Database**: Business profile and conversation history

## Directory Structure

```
fusion-galeria-client/
├── nanoclaw/                    # AI Receptionist
│   ├── package.json
│   ├── server.js               # Main server
│   ├── message-router.js       # Routes incoming messages
│   ├── receptionist-logic.js   # AI business logic
│   └── response-router.js      # Response handling
├── storage/                     # Data persistence
│   ├── schema.sql              # Database schema
│   ├── db.js                   # Database helper
│   └── business-profile.json   # Business info
├── whatsapp-gateway/           # WhatsApp integration
│   └── gateway.js              # Baileys instance
└── config/                      # Configuration
    ├── fusion-galeria.env      # Environment variables
    ├── nanoclaw-config.json    # NanoClaw config
    ├── qr-codes/               # QR code storage
    └── auth/                   # WhatsApp auth state
```

## Setup

### 1. Install Dependencies

```bash
cd nanoclaw
npm install
```

### 2. Configure Environment

```bash
cp config/fusion-galeria.env.example config/fusion-galeria.env
# Edit config/fusion-galeria.env with your values
```

### 3. Start Services

```bash
# Start NanoClaw
cd nanoclaw
npm start

# Start WhatsApp Gateway (in another terminal)
cd whatsapp-gateway
node gateway.js
```

## Usage

### Health Checks

```bash
# NanoClaw health
curl http://localhost:3001/health

# WhatsApp Gateway health
curl http://localhost:3101/health
```

### QR Code

Scan the QR code to connect WhatsApp:

```bash
curl http://localhost:3101/qr
```

### Manual Restart

```bash
curl -X POST http://localhost:3101/restart
```

## Business Profile

Edit `storage/business-profile.json` to update:
- Business name and description
- Contact information
- Services offered
- Pricing information
- Operating hours

## Monitoring

The client integrates with the shared monitoring system:
- QR code alerts
- Connection status
- Escalation notifications

## Ports

| Service | Port |
|---------|------|
| NanoClaw | 3001 |
| WhatsApp Gateway | 3101 |

## Support

For issues or questions, check the main README or contact the development team.
