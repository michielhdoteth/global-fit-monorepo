# Shared Components

This directory contains shared components used by all client gateways.

## Directory Structure

```
shared/
├── brain-api/              # Multi-tenant brain API
│   ├── index.js            # Main Express server
│   ├── tenant-router.js    # Tenant routing logic
│   └── tools/              # Shared tools
│       ├── booking.js      # Appointment booking
│       ├── faq.js          # FAQ handling
│       └── escalation.js   # Escalation logic
└── monitoring/             # Shared monitoring system
    ├── connection-watcher.js  # Gateway health monitoring
    └── alert-sender.js       # Alert notifications
```

## Brain API

The brain API is a shared Express server that handles all client requests. It uses tenant routing to determine which client's data to use.

### Starting the Brain API

```bash
cd brain-api
npm install
node index.js
```

The API will listen on port 3000 by default (configurable via `BRAIN_API_PORT`).

### API Endpoints

All endpoints require the `X-Client-ID` header.

#### Health Check

```bash
curl -H "X-Client-ID: client-a" http://localhost:3000/health
```

#### Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: client-a" \
  -d '{
    "message": "What are your hours?",
    "sender": "+1234567890",
    "timestamp": "2024-01-01T10:00:00Z"
  }'
```

#### Get Profile

```bash
curl -H "X-Client-ID: client-a" http://localhost:3000/api/profile
```

#### Get Conversations

```bash
curl -H "X-Client-ID: client-a" "http://localhost:3000/api/conversations?limit=50"
```

## Monitoring

The monitoring system watches all client gateway connections and sends alerts when issues are detected.

### Starting the Connection Watcher

```bash
cd monitoring
node connection-watcher.js
```

The watcher will check all gateways every 30 seconds by default.

### Checking Status

```bash
# One-time check
node connection-watcher.js --once

# Status summary
node connection-watcher.js --status
```

### Alert Configuration

Alerts are configured via environment variables:

```bash
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_IDS="chat_id_1,chat_id_2"
export SMS_ENABLED="false"
export SMS_RECIPIENTS=""
```

### Testing Alerts

```bash
node alert-sender.js --test
```

## Adding a New Client

### 1. Add Tenant Configuration

Edit `brain-api/tenant-router.js` and add your new client to `TENANT_CONFIG`:

```javascript
const TENANT_CONFIG = {
  'client-a': { ... },
  'client-b': { ... },
  'client-c': { ... },
  'client-d': {              // Add this
    name: 'Client D',
    port: 2903,              // Next available port
    dbPath: path.join(__dirname, '../../client-d/storage/db.sqlite3'),
    envPath: path.join(__dirname, '../../client-d/config/client-d.env')
  }
};
```

### 2. Create Client Directory

Copy an existing client directory (e.g., client-a) and modify:

```bash
cp -r client-a client-d
cd client-d
```

Update all files to reference the new client ID and port.

### 3. Start the New Gateway

```bash
pm2 start whatsapp-gateway/gateway.js --name client-d-gateway
```

The connection watcher will automatically detect and monitor the new gateway.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Client A   │      │  Client B   │      │  Client C   │
│  Port 2900  │      │  Port 2901  │      │  Port 2902  │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   Brain API    │
                    │   Multi-Tenant │
                    │   Port 3000    │
                    └────────┬───────┘
                             │
                    ┌────────▼────────┐
                    │   Per-Client    │
                    │   SQLite DBs    │
                    └─────────────────┘
```

## Security

- Each tenant has isolated database access
- Tenant routing is based on X-Client-ID header
- Rate limiting is per-tenant
- No shared state between clients
