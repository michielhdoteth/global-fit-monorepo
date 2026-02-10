# Multi-Tenant WhatsApp Receptionist

A single Ubuntu VPS hosting multiple WhatsApp receptionist clients with shared brain API and isolated gateways.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Ubuntu VPS (Single Host)                     │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Client A   │  │  Client B   │  │  Client C   │  ...          │
│  │  Port 2900  │  │  Port 2901  │  │  Port 2902  │              │
│  │  Baileys    │  │  Baileys    │  │  Baileys    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           │                                      │
│                   ┌───────▼────────┐                            │
│                   │  Shared Brain  │                            │
│                   │      API       │                            │
│                   │   (Multi-Tenant)│                            │
│                   │    Port 3000    │                            │
│                   └────────┬───────┘                            │
│                            │                                     │
│                   ┌────────▼────────┐                            │
│                   │   Per-Client    │                            │
│                   │  SQLite DBs     │                            │
│                   └─────────────────┘                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Shared Monitoring System                  │   │
│  │  • Connection Watcher                                  │   │
│  │  • Alert Sender (Telegram/SMS)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

- **Single VPS**: One Ubuntu server hosting all clients
- **Multi-tenant Brain**: Single API serving multiple clients
- **Isolated Gateways**: Each client has independent Baileys instance
- **Tenant Routing**: Brain API routes requests by client ID
- **Shared Tools**: Same tools, client-specific data
- **Per-Client Database**: Isolated SQLite databases
- **Unified Monitoring**: Single system watching all gateways
- **Per-Client Alerts**: Notifications with client identifier

## Quick Start

### 1. Prerequisites

```bash
# Ubuntu 20.04+ with Node.js 18+
sudo apt update
sudo apt install -y nodejs npm sqlite3

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Install Dependencies

```bash
# Brain API
cd shared/brain-api
npm install

# Client Gateways
cd ../../client-a/whatsapp-gateway && npm install
cd ../../client-b/whatsapp-gateway && npm install
cd ../../client-c/whatsapp-gateway && npm install
```

### 3. Configure Each Client

```bash
# Client A
cd client-a
cp config/client-a.env.example config/client-a.env
nano config/client-a.env  # Edit your settings

# Repeat for Client B and C
cd ../client-b && cp config/client-b.env.example config/client-b.env && nano config/client-b.env
cd ../client-c && cp config/client-c.env.example config/client-c.env && nano config/client-c.env
```

### 4. Initialize Databases

```bash
# From root
cd client-a && node storage/db.js && cd ..
cd client-b && node storage/db.js && cd ..
cd client-c && node storage/db.js && cd ..
```

### 5. Start Services

```bash
# Start Brain API
pm2 start shared/brain-api/index.js --name brain-api

# Start Client Gateways
pm2 start client-a/whatsapp-gateway/gateway.js --name client-a-gateway
pm2 start client-b/whatsapp-gateway/gateway.js --name client-b-gateway
pm2 start client-c/whatsapp-gateway/gateway.js --name client-c-gateway

# Start Monitoring
pm2 start shared/monitoring/connection-watcher.js --name connection-watcher

# Save PM2 configuration
pm2 save
pm2 startup
```

### 6. Connect WhatsApp

Get QR codes for each client:

```bash
# Client A
curl http://localhost:2900/qr | jq .qr

# Client B
curl http://localhost:2901/qr | jq .qr

# Client C
curl http://localhost:2902/qr | jq .qr
```

Scan each QR with the respective WhatsApp business account.

## Adding a New Client

### 1. Allocate a Port

Ports start at 2900 and increment:
- Client A: 2900
- Client B: 2901
- Client C: 2902
- Client D: 2903 (next available)

### 2. Create Client Directory

```bash
# Copy template (Client A)
cp -r client-a client-d

# Update all references
cd client-d
find . -type f -exec sed -i 's/client-a/client-d/g; s/Client A/Client D/g; s/2900/2903/g' {} +
```

### 3. Update Brain API Tenant Config

Edit `shared/brain-api/tenant-router.js`:

```javascript
const TENANT_CONFIG = {
  // ... existing clients ...
  'client-d': {
    name: 'Client D',
    port: 2903,
    dbPath: path.join(__dirname, '../../client-d/storage/db.sqlite3'),
    envPath: path.join(__dirname, '../../client-d/config/client-d.env')
  }
};
```

### 4. Start the New Gateway

```bash
cd client-d/whatsapp-gateway
pm2 start gateway.js --name client-d-gateway
```

The connection watcher will automatically detect and monitor the new client.

## Monitoring & Alerts

### Check Connection Status

```bash
node shared/monitoring/connection-watcher.js --status
```

Output:
```
==================================================
CONNECTION STATUS SUMMARY
==================================================
✅ client-a: CONNECTED
   Last seen: 2024-01-01 10:00:00
   Failures: 0

✅ client-b: CONNECTED
   Last seen: 2024-01-01 10:00:00
   Failures: 0

❌ client-c: DISCONNECTED
   Last seen: 2024-01-01 09:55:00
   Failures: 3
```

### Configure Alerts

Edit environment variables or add to `.bashrc`:

```bash
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_IDS="chat_id_1,chat_id_2,chat_id_3"
export SMS_ENABLED="false"
export SMS_RECIPIENTS=""
```

### Test Alerts

```bash
node shared/monitoring/alert-sender.js --test
```

## API Usage

### Send Message to Client

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: client-a" \
  -d '{
    "message": "I want to book an appointment",
    "sender": "+1234567890",
    "timestamp": "2024-01-01T10:00:00Z"
  }'
```

### Get Client Profile

```bash
curl -H "X-Client-ID: client-a" http://localhost:3000/api/profile
```

### Get Conversation History

```bash
curl -H "X-Client-ID: client-a" "http://localhost:3000/api/conversations?limit=50"
```

## Operations

### Restart a Client Gateway

```bash
# Client A
curl -X POST http://localhost:2900/restart

# Or via PM2
pm2 restart client-a-gateway
```

### Toggle Handoff Mode

```bash
# Enable (stop auto-replies)
curl -X POST http://localhost:2900/handoff/on

# Disable (resume auto-replies)
curl -X POST http://localhost:2900/handoff/off
```

### View Logs

```bash
# All services
pm2 logs

# Specific service
pm2 logs client-a-gateway

# Brain API
pm2 logs brain-api

# Connection watcher
pm2 logs connection-watcher
```

## Database Operations

### Access Client Database

```bash
sqlite3 client-a/storage/db.sqlite3
```

### Common Queries

```sql
-- Get business profile
SELECT * FROM business_profile;

-- Get recent conversations
SELECT * FROM conversations ORDER BY timestamp DESC LIMIT 20;

-- Check operating hours
SELECT * FROM operating_hours;

-- Get escalation contacts
SELECT * FROM escalation_contacts;

-- Check pending escalations
SELECT * FROM escalations WHERE status = 'pending';
```

## Troubleshooting

### Gateway Not Starting

1. Check port availability:
   ```bash
   netstat -tlnp | grep 2900
   ```

2. Check logs:
   ```bash
   pm2 logs client-a-gateway
   ```

3. Verify database exists:
   ```bash
   ls -la client-a/storage/db.sqlite3
   ```

### QR Code Not Generating

1. Check health endpoint:
   ```bash
   curl http://localhost:2900/health
   ```

2. Verify auth directory exists:
   ```bash
   ls -la client-a/config/auth
   ```

3. Check logs for errors

### Messages Not Being Processed

1. Verify Brain API is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check handoff mode status:
   ```bash
   curl http://localhost:2900/health | jq .handoffMode
   ```

3. Check Brain API logs

### Connection Watcher Not Detecting Gateway

1. Verify gateway is responding:
   ```bash
   curl http://localhost:2900/health
   ```

2. Check connection watcher logs:
   ```bash
   pm2 logs connection-watcher
   ```

3. Verify tenant configuration in `tenant-router.js`

## Security Considerations

- **Never commit**: `.env` files, `config/auth/` directory, `config/qr-codes/` directory
- **Database isolation**: Each client has separate SQLite database
- **Port isolation**: Each client on unique port
- **Tenant routing**: Based on `X-Client-ID` header
- **Rate limiting**: Per-tenant to prevent abuse

## Backup & Recovery

### Backup All Data

```bash
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup databases
cp client-a/storage/db.sqlite3 $BACKUP_DIR/client-a-db.sqlite3
cp client-b/storage/db.sqlite3 $BACKUP_DIR/client-b-db.sqlite3
cp client-c/storage/db.sqlite3 $BACKUP_DIR/client-c-db.sqlite3

# Backup auth sessions
tar -czf $BACKUP_DIR/auth-sessions.tar.gz client-*/config/auth

# Backup configs
tar -czf $BACKUP_DIR/configs.tar.gz client-*/config/*.env
```

### Restore from Backup

```bash
# Restore database
cp backup/client-a-db.sqlite3 client-a/storage/db.sqlite3

# Restart gateway
pm2 restart client-a-gateway
```

## Performance Optimization

### Resource Limits (PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'brain-api',
      script: './shared/brain-api/index.js',
      max_memory_restart: '500M',
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'client-a-gateway',
      script: './client-a/whatsapp-gateway/gateway.js',
      max_memory_restart: '300M'
    }
  ]
};
```

### Database Optimization

```bash
# Run VACUUM to optimize database
sqlite3 client-a/storage/db.sqlite3 "VACUUM;"
```

## Support & Documentation

- Client-specific docs: `client-*/README.md`
- Shared components: `shared/README.md`
- Brain API tools: `shared/brain-api/tools/`
- Monitoring: `shared/monitoring/`

## License

Private - 4mlabs Internal Use
