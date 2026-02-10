# Client A - WhatsApp Receptionist

## Overview

This is the WhatsApp receptionist instance for Client A. It runs on port **2900** and has its own isolated database and configuration.

## Directory Structure

```
client-a/
├── whatsapp-gateway/
│   ├── gateway.js           # Main Baileys WhatsApp connection
│   ├── session-manager.js   # Session state management
│   └── qr-handler.js        # QR code generation/handling
├── storage/
│   ├── db.sqlite3           # SQLite database (per-client)
│   ├── schema.sql           # Database schema
│   └── db.js                # Database helper functions
├── config/
│   ├── client-a.env         # Environment configuration
│   ├── auth/                # WhatsApp session files
│   └── qr-codes/            # Generated QR codes
└── README.md                # This file
```

## Setup

### 1. Install Dependencies

```bash
cd whatsapp-gateway
npm install
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp config/client-a.env.example config/client-a.env
# Edit config/client-a.env with your settings
```

### 3. Initialize Database

```bash
node storage/db.js
```

### 4. Start the Gateway

```bash
# Using PM2 (recommended)
pm2 start whatsapp-gateway/gateway.js --name client-a-gateway

# Or directly
node whatsapp-gateway/gateway.js
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Gateway HTTP port | 2900 |
| CLIENT_ID | Client identifier | client-a |
| BRAIN_API_URL | Brain API URL | http://localhost:3000 |
| TELEGRAM_BOT_TOKEN | Telegram bot for alerts | - |
| TELEGRAM_CHAT_IDS | Comma-separated chat IDs | - |

## API Endpoints

### Health Check

```bash
curl http://localhost:2900/health
```

### Get QR Code

```bash
curl http://localhost:2900/qr
```

### Restart Gateway

```bash
curl -X POST http://localhost:2900/restart
```

### Toggle Handoff Mode

```bash
# Enable
curl -X POST http://localhost:2900/handoff/on

# Disable
curl -X POST http://localhost:2900/handoff/off
```

## Operations

### Viewing Logs

```bash
# PM2 logs
pm2 logs client-a-gateway

# Or journalctl if using systemd
journalctl -u client-a-gateway -f
```

### Checking Status

```bash
curl http://localhost:2900/health | jq
```

### Restarting

```bash
pm2 restart client-a-gateway
```

## Database Queries

### Business Profile

```bash
sqlite3 storage/db.sqlite3 "SELECT * FROM business_profile;"
```

### Conversations

```bash
sqlite3 storage/db.sqlite3 "SELECT * FROM conversations ORDER BY timestamp DESC LIMIT 20;"
```

### Escalations

```bash
sqlite3 storage/db.sqlite3 "SELECT * FROM escalations WHERE status = 'pending';"
```

## Troubleshooting

### Gateway not connecting

1. Check health endpoint: `curl http://localhost:2900/health`
2. Check logs: `pm2 logs client-a-gateway`
3. Verify QR code: `curl http://localhost:2900/qr`
4. Check database exists: `ls -la storage/db.sqlite3`

### QR code not generating

1. Check config/qr-codes directory exists
2. Verify permissions on config directory
3. Check logs for errors

### Messages not receiving responses

1. Verify brain API is accessible
2. Check handoff mode: `curl http://localhost:2900/health | jq .handoffMode`
3. Check brain API logs

## Monitoring

The shared monitoring system watches all client gateways:

```bash
# Check all connections
node ../../shared/monitoring/connection-watcher.js --status
```

Alerts are sent to configured Telegram/SMS when:
- Connection lost (3+ consecutive failures)
- QR code needed
- Customer escalation

## Security Notes

- Each client has isolated database
- Session files stored in config/auth (never commit)
- QR codes stored in config/qr-codes
- Environment file contains sensitive data (never commit)

## Support

For issues with Client A specifically, check:
1. Gateway logs in pm2
2. Database connectivity
3. Brain API accessibility
4. Shared monitoring alerts
