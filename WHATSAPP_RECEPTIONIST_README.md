# WhatsApp Receptionist Integration

A clean, standalone WhatsApp receptionist system using Baileys for WhatsApp integration, an LLM-powered brain for intelligent responses, and SQLite for data storage.

## Architecture

```
┌─────────────┐
│  WhatsApp   │
│   User      │
└──────┬──────┘
       │
       │ WhatsApp Message
       ▼
┌─────────────────────────────────┐
│    WhatsApp Gateway (Baileys)   │
│  - Session Management           │
│  - QR Code Handling             │
│  - Message Routing              │
└──────┬──────────────────────────┘
       │
       │ Forward to Brain
       ▼
┌─────────────────────────────────┐
│     Brain API (LLM)             │
│  - Receptionist Prompt          │
│  - Tools (Booking, FAQ, Escalation) │
│  - Stateless (Vercel-ready)     │
└──────┬──────────────────────────┘
       │
       │ Data Operations
       ▼
┌─────────────────────────────────┐
│    SQLite Storage               │
│  - Business Profiles            │
│  - Conversation Logs            │
│  - Business Hours               │
│  - Escalation Contacts          │
└─────────────────────────────────┘
```

## Features

### 🤖 Intelligent Receptionist
- LLM-powered responses using GPT-4
- Context-aware conversations
- Tool calling for bookings, FAQs, and escalation

### 📱 WhatsApp Integration
- Clean Baileys-based gateway
- Manual QR code handling (no auto-scan)
- Connection state monitoring
- Session persistence

### ⏰ Business Logic
- Configurable business hours
- Out-of-hours auto-replies
- Handoff mode for human intervention

### 📊 Monitoring & Alerts
- Real-time connection monitoring
- Telegram alerts for disconnections
- QR code web interface
- Restart capability

### 💾 Data Storage
- SQLite database (simple, portable)
- Conversation history
- Business profiles
- Escalation contacts

## Quick Start

### Prerequisites
- Node.js 18+
- VPS (Ubuntu recommended)
- WhatsApp Business account

### 1. Clone and Install

```bash
cd whatsapp-gateway
npm install
```

```bash
cd ../brain-api
npm install
```

### 2. Configure Environment

**WhatsApp Gateway (.env)**
```bash
cp whatsapp-gateway/.env.example whatsapp-gateway/.env
```

Edit the following variables:
- `PORT=3000`
- `BRAIN_API_URL=http://localhost:3001`
- `DATABASE_PATH=./storage/whatsapp.db`
- `TELEGRAM_BOT_TOKEN=your_bot_token` (optional)
- `TELEGRAM_CHAT_ID=your_chat_id` (optional)

**Brain API (.env)**
```bash
cp brain-api/.env.example brain-api/.env
```

Edit the following variables:
- `PORT=3001`
- `OPENAI_API_KEY=your_openai_api_key`
- `API_KEY=your_api_key`

### 3. Initialize Database

The database is automatically initialized on first run. Alternatively, you can run:

```bash
cd storage
sqlite3 whatsapp.db < schema.sql
```

### 4. Start Services

**Terminal 1 - WhatsApp Gateway:**
```bash
cd whatsapp-gateway
npm start
```

**Terminal 2 - Brain API:**
```bash
cd brain-api
npm start
```

### 5. Link WhatsApp Device

1. Open `http://localhost:3000/qr` in your browser
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code

Once connected, the QR page will show "Connected" status.

## API Endpoints

### WhatsApp Gateway

#### Health Check
```
GET /health
```
Returns gateway status and connection state.

#### QR Code Page
```
GET /qr
```
Displays QR code for linking WhatsApp device.

#### Status
```
GET /api/status
```
Returns current connection status and handoff mode.

#### Restart Gateway
```
POST /api/restart
```
Restarts the WhatsApp connection.

#### Toggle Handoff Mode
```
POST /api/handoff/toggle
GET /api/handoff
```
Enable/disable handoff mode (stops auto-replies).

### Brain API

#### Receptionist Endpoint
```
POST /api/receptionist
```

Headers:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

Body:
```json
{
  "phoneNumber": "+1234567890",
  "message": "Hello, I'd like to book an appointment",
  "businessProfile": {
    "name": "My Business",
    "description": "Business description",
    "welcomeMessage": "Welcome!"
  },
  "conversationHistory": [
    {
      "role": "user",
      "message": "Previous message"
    }
  ]
}
```

## Configuration

### Business Hours

Update business hours in the database:

```javascript
// Example: Set Monday hours to 9 AM - 5 PM
db.updateBusinessHours('monday', { open: 9, close: 17, isClosed: false });
```

### Business Profile

```javascript
// Update business information
db.updateBusinessProfile({
  name: 'My Business',
  description: 'We provide great services',
  phone: '+1234567890',
  email: 'contact@example.com',
  address: '123 Main St',
  outOfHoursMessage: 'We are closed. Leave a message!',
  welcomeMessage: 'Welcome! How can we help?'
});
```

## Deployment

### VPS Deployment (Ubuntu)

1. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PM2 (Process Manager):**
```bash
sudo npm install -g pm2
```

3. **Deploy the application:**
```bash
git clone <your-repo>
cd <your-repo>/whatsapp-gateway
npm install
cp .env.example .env
# Edit .env with your settings
pm2 start gateway.js --name whatsapp-gateway
pm2 startup
pm2 save
```

4. **Deploy Brain API:**
```bash
cd ../brain-api
npm install
cp .env.example .env
# Edit .env with your settings
pm2 start index.js --name brain-api
pm2 save
```

### Vercel Deployment (Brain API)

The Brain API is designed to run on Vercel:

1. Push to your repository
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Monitoring

### Check Status

```bash
curl http://localhost:3000/health
```

### View Logs

```bash
pm2 logs whatsapp-gateway
pm2 logs brain-api
```

### Monitor Connection

The connection watcher automatically checks the WhatsApp connection every 30 seconds and sends alerts if disconnected.

## Troubleshooting

### QR Code Not Showing
- Check that the gateway is running
- Check logs: `pm2 logs whatsapp-gateway`
- Ensure the sessions directory is writable

### Connection Drops
- Check internet connection
- Verify WhatsApp Business account status
- Check `/qr` endpoint - if it shows QR, re-scan

### No Auto-Replies
- Check handoff mode: `GET /api/handoff`
- Verify Brain API is accessible
- Check business hours configuration
- Review gateway logs

### Database Errors
- Ensure storage directory exists and is writable
- Check database path in .env
- Verify SQLite is installed

## Security

- Keep API keys secure (never commit to git)
- Use HTTPS in production
- Enable rate limiting
- Restrict API access by IP if possible
- Use environment variables for all sensitive data

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
