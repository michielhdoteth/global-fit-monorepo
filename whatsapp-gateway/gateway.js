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
import Database from '../storage/db.js';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize session manager
const sessionManager = new SessionManager(process.env.SESSION_PATH || './sessions');
const qrHandler = new QRHandler(sessionManager);

// Initialize database
const db = new Database(process.env.DATABASE_PATH || './storage/whatsapp.db');

// Store for messages
const store = makeInMemoryStore({ logger });

// WhatsApp socket
let sock = null;

// Handoff mode - when true, don't auto-reply
let handoffMode = false;

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

    // Store conversation
    await db.storeConversation(remoteJid, 'user', text);

    // Check if handoff mode is active
    if (handoffMode) {
      logger.info({ remoteJid }, 'Handoff mode active - skipping auto-reply');
      return;
    }

    // Check business hours
    const businessHours = await db.getBusinessHours();
    const withinHours = checkBusinessHours(businessHours);

    if (!withinHours) {
      await sendOutOfHoursReply(remoteJid);
      return;
    }

    // Send to Brain API
    const response = await callBrainAPI(remoteJid, text);

    if (response && response.reply) {
      await sock.sendMessage(remoteJid, { text: response.reply });
      await db.storeConversation(remoteJid, 'assistant', response.reply);
      logger.info({ to: remoteJid, reply: response.reply }, 'Sent reply');
    }

  } catch (error) {
    logger.error({ error }, 'Error handling message');
  }
}

async function callBrainAPI(phoneNumber, message) {
  try {
    const businessProfile = await db.getBusinessProfile();
    const conversationHistory = await db.getConversationHistory(phoneNumber, 10);

    const response = await fetch(`${process.env.BRAIN_API_URL}/api/receptionist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BRAIN_API_KEY || ''}`
      },
      body: JSON.stringify({
        phoneNumber,
        message,
        businessProfile,
        conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error(`Brain API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error({ error }, 'Error calling Brain API');
    return null;
  }
}

function checkBusinessHours(businessHours) {
  if (!businessHours) return true;

  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const hour = now.getHours();

  const todayHours = businessHours[day];
  if (!todayHours) return false;

  return hour >= todayHours.open && hour < todayHours.close;
}

async function sendOutOfHoursReply(remoteJid) {
  const businessProfile = await db.getBusinessProfile();
  const reply = businessProfile?.outOfHoursMessage || 
    'Thank you for your message! We are currently outside of business hours. We will get back to you as soon as we open.';

  await sock.sendMessage(remoteJid, { text: reply });
  await db.storeConversation(remoteJid, 'assistant', reply);
}

async function sendAlert(message) {
  // Send Telegram alert if configured
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const { Telegraf } = await import('telegraf');
      const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, `🚨 WhatsApp Alert: ${message}`);
    } catch (error) {
      logger.error({ error }, 'Failed to send Telegram alert');
    }
  }

  // Could add SMS alert here via Twilio
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

app.post('/api/restart', async (req, res) => {
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

app.post('/api/handoff/toggle', (req, res) => {
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
  
  // Initialize database
  await db.initialize();
  
  // Start WhatsApp connection
  await startWhatsApp();
});

export default app;
