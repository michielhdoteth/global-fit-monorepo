# Client C - WhatsApp Receptionist

## Overview

This is the WhatsApp receptionist instance for Client C. It runs on port **2902** and has its own isolated database and configuration.

## Directory Structure

```
client-c/
├── whatsapp-gateway/
│   ├── gateway.js           # Main Baileys WhatsApp connection
│   ├── session-manager.js   # Session state management
│   └── qr-handler.js        # QR code generation/handling
├── storage/
│   ├── db.sqlite3           # SQLite database (per-client)
│   ├── schema.sql           # Database schema
│   └── db.js                # Database helper functions
├── config/
│   ├── client-c.env         # Environment configuration
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

```bash
cp config/client-c.env.example config/client-c.env
# Edit config/client-c.env with your settings
```

### 3. Initialize Database

```bash
node storage/db.js
```

### 4. Start the Gateway

```bash
pm2 start whatsapp-gateway/gateway.js --name client-c-gateway
```

## API Endpoints

### Health Check

```bash
curl http://localhost:2902/health
```

### Get QR Code

```bash
curl http://localhost:2902/qr
```

### Restart Gateway

```bash
curl -X POST http://localhost:2902/restart
```

### Toggle Handoff Mode

```bash
# Enable
curl -X POST http://localhost:2902/handoff/on

# Disable
curl -X POST http://localhost:2902/handoff/off
```

## Monitoring

The shared monitoring system watches all client gateways:

```bash
node ../../shared/monitoring/connection-watcher.js --status
```
