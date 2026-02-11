import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore
} from '@whiskeysockets/baileys';
import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { SessionManager } from './session-manager.js';
import { QRHandler } from './qr-handler.js';
import openai from 'openai';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize session manager
const sessionManager = new SessionManager(process.env.SESSION_PATH || './sessions');
const qrHandler = new QRHandler(sessionManager);

// Store for messages
const store = makeInMemoryStore({ logger });

// WhatsApp socket
let sock = null;

// Handoff mode - when true, don't auto-reply
let handoffMode = false;

// Conversation memory for each chat
const conversations = new Map();

// Business profile
const BUSINESS_PROFILE = {
  name: process.env.CLIENT_NAME || 'Global Fit',
  description: 'Your 24/7 Fitness Center',
  welcomeMessage: 'Welcome to Global Fit! How can I help you today?',
  outOfHoursMessage: 'Thank you for your message! We are currently outside of business hours. We will get back to you as soon as we open.',
  operatingHours: {
    monday: { open: 5, close: 23 },
    tuesday: { open: 5, close: 23 },
    wednesday: { open: 5, close: 23 },
    thursday: { open: 5, close: 23 },
    friday: { open: 5, close: 22 },
    saturday: { open: 7, close: 20 },
    sunday: { open: 8, close: 20 }
  }
};

async function startWhatsApp() {
  try {
    sessionManager.ensureSessionDir();
    const { state, saveCreds } = await useMultiFileAuthState(sessionManager.getSessionPath('default'));

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: ['Global Fit Receptionist', 'Chrome', '1.0.0']
    });

    store.bind(sock.ev);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info('QR code received');
        const qrDataURL = await qrHandler.generateQRCode(qr);
        sessionManager.setConnectionState('default', 'needs_qr');
        handoffMode = true;
        await sendAlert('WhatsApp needs QR code scan!');
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.info({ shouldReconnect }, 'Connection closed');

        if (shouldReconnect) {
          sessionManager.setConnectionState('default', 'disconnected');
          await sendAlert('WhatsApp connection lost, reconnecting...');
          startWhatsApp();
        } else {
          sessionManager.setConnectionState('default', 'needs_qr');
          handoffMode = true;
          await sendAlert('WhatsApp logged out - needs QR scan!');
        }
      } else if (connection === 'open') {
        logger.info('WhatsApp connection opened');
        sessionManager.setConnectionState('default', 'connected');
        qrHandler.clearQR();
        handoffMode = false;
        await sendAlert('WhatsApp connected successfully!');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message) continue;

        // Only handle messages from others (not from ourselves)
        if (msg.key.fromMe) continue;

        await handleMessage(msg);
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start WhatsApp');
    throw error;
  }
}

async function handleMessage(msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const messageContent = msg.message;

    // Extract text message
    let text = '';
    if (messageContent.conversation) {
      text = messageContent.conversation;
    } else if (messageContent.extendedTextMessage) {
      text = messageContent.extendedTextMessage.text;
    } else if (messageContent.imageMessage) {
      text = messageContent.imageMessage.caption || '';
    }

    if (!text) return;

    logger.info({ from: remoteJid, text }, 'Received message');

    // Check if handoff mode is active
    if (handoffMode) {
      logger.info({ remoteJid }, 'Handoff mode active - skipping auto-reply');
      return;
    }

    // Get conversation history
    if (!conversations.has(remoteJid)) {
      conversations.set(remoteJid, []);
    }
    const history = conversations.get(remoteJid);
    const recentMessages = history.slice(-10).map(m => ({ role: m.role, content: m.content }));

    // Add user message to history
    recentMessages.push({ role: 'user', content: text });

    // Generate response using OpenAI
    const response = await generateAIResponse(text, recentMessages);

    // Send response
    if (response) {
      await sock.sendMessage(remoteJid, { text: response });

      // Add assistant response to history
      recentMessages.push({ role: 'assistant', content: response });
      conversations.set(remoteJid, recentMessages.slice(-20));

      logger.info({ to: remoteJid, response }, 'Sent reply');
    }

  } catch (error) {
    logger.error({ error }, 'Error handling message');
  }
}

async function generateAIResponse(userMessage, conversationHistory) {
  try {
    const openai = new openai({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build system prompt
    const systemPrompt = `You are a helpful receptionist for ${BUSINESS_PROFILE.name}, a fitness center.

${BUSINESS_PROFILE.description}

Welcome message: "${BUSINESS_PROFILE.welcomeMessage}"
Out of hours message: "${BUSINESS_PROFILE.outOfHoursMessage}"

Business Hours:
Monday - Friday: 5:00 AM - 11:00 PM
Saturday: 7:00 AM - 8:00 PM
Sunday: 8:00 AM - 8:00 PM

Services:
- 24/7 gym access for premium members
- Personal training sessions
- Group fitness classes
- Nutritional counseling

Your role is to:
1. Greet customers warmly
2. Answer questions about hours, location, services, pricing
3. Help schedule appointments or consultations
4. Provide information about memberships and classes
5. Be friendly, professional, and concise

Keep responses under 150 words when possible. If someone needs immediate assistance or wants to speak to a human, let them know they can call during business hours.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || null;

  } catch (error) {
    logger.error({ error }, 'OpenAI API error');

    // Fallback response if API fails
    if (error.status === 401 || error.code === 'insufficient_quota') {
      return `Thank you for your message! Our team is currently busy. Please call us during business hours or try again later.`;
    }

    return `I'm here to help! For immediate assistance, please contact us during business hours.`;
  }
}

function checkBusinessHours() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const hour = now.getHours();

  const todayHours = BUSINESS_PROFILE.operatingHours[day];
  if (!todayHours) return false;

  return hour >= todayHours.open && hour < todayHours.close;
}

async function sendAlert(message) {
  // Send Telegram alert if configured
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const fetch = (await import('node-fetch')).default;
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `WhatsApp Alert: ${message}`
        })
      });
    } catch (error) {
      logger.error({ error }, 'Failed to send Telegram alert');
    }
  }
}

// Express routes
app.use(express.json());

app.get('/health', (req, res) => {
  const state = sessionManager.getConnectionState('default');
  res.json({
    status: 'ok',
    whatsapp: state,
    handoffMode,
    timestamp: new Date().toISOString()
  });
});

app.get('/qr', (req, res) => {
  const state = sessionManager.getConnectionState('default');

  res.setHeader('Content-Type', 'text/html');

  if (state.state === 'connected') {
    res.send(qrHandler.renderConnectedHTML());
  } else {
    const qrInfo = qrHandler.getQRCode();
    res.send(qrHandler.renderHTML(qrInfo.qr));
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    ...sessionManager.getConnectionState('default'),
    handoffMode,
    qrAvailable: qrHandler.getQRCode().qr !== null
  });
});

// Protected endpoints with API key
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'change-me-in-production';

  if (apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/api/restart', authenticate, async (req, res) => {
  try {
    if (sock) {
      sock.logout();
      sock.end(undefined);
    }
    await startWhatsApp();
    res.json({ status: 'restarted' });
  } catch (error) {
    logger.error({ error }, 'Failed to restart');
    res.status(500).json({ error: 'Failed to restart' });
  }
});

app.post('/api/handoff/toggle', authenticate, (req, res) => {
  handoffMode = !handoffMode;
  logger.info({ handoffMode }, 'Handoff mode toggled');
  res.json({ handoffMode });
});

app.get('/api/handoff', (req, res) => {
  res.json({ handoffMode });
});

// Start server
app.listen(PORT, async () => {
  logger.info({ PORT }, 'WhatsApp Gateway server started');

  // Start WhatsApp connection
  await startWhatsApp();
});

export default app;
