/**
 * WhatsApp Gateway - Client B
 * Baileys instance running on port 2901
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const path = require('path');
const sessionManager = require('./session-manager');
const qrHandler = require('./qr-handler');

const app = express();
const PORT = process.env.PORT || 2901;
const CLIENT_ID = 'client-b';
const DB_PATH = path.join(__dirname, '../storage/db.sqlite3');
const CONFIG_PATH = path.join(__dirname, '../config');

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname'
    }
  }
}).child({ clientId: CLIENT_ID });

let sock = null;
let connectionState = 'disconnected';
let qrCode = null;
let handoffMode = false;

async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(CONFIG_PATH, 'auth')
  );
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ['Client B Receptionist', 'Chrome', '1.0.0']
  });
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCode = qr;
      connectionState = 'needs_qr';
      handoffMode = true;
      
      logger.info('QR Code received - scanning needed');
      qrHandler.saveQR(CLIENT_ID, qr);
      
      const alertSender = require('../../shared/monitoring/alert-sender');
      alertSender.sendQRNeededAlert(CLIENT_ID, { name: 'Client B', port: PORT }, qr);
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        connectionState = 'disconnected';
        logger.error('Connection closed - reconnecting...');
        qrCode = null;
        setTimeout(() => initWhatsApp(), 5000);
      } else {
        connectionState = 'logged_out';
        logger.error('Connection closed - logged out');
      }
    } else if (connection === 'open') {
      connectionState = 'connected';
      handoffMode = false;
      qrCode = null;
      logger.info('✅ Connected to WhatsApp');
      sessionManager.updateSessionState(DB_PATH, CLIENT_ID, 'connected');
    }
  });
  
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    for (const msg of messages) {
      if (!msg.message) continue;
      
      if (handoffMode) {
        logger.info({ from: msg.key.remoteJid }, 'Message ignored - handoff mode active');
        continue;
      }
      
      await handleMessage(msg);
    }
  });
  
  sock.ev.on('creds.update', saveCreds);
}

async function handleMessage(msg) {
  const remoteJid = msg.key.remoteJid;
  const messageContent = msg.message;
  
  let text = '';
  if (messageContent.conversation) {
    text = messageContent.conversation;
  } else if (messageContent.extendedTextMessage) {
    text = messageContent.extendedTextMessage.text;
  }
  
  logger.info({ from: remoteJid, text }, 'Received message');
  
  try {
    const response = await sendToBrainAPI(text, remoteJid);
    await sock.sendMessage(remoteJid, { text: response.response });
    logger.info({ to: remoteJid }, 'Response sent');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process message');
  }
}

async function sendToBrainAPI(message, sender) {
  const brainApiUrl = process.env.BRAIN_API_URL || 'http://localhost:3000';
  
  const response = await fetch(`${brainApiUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': CLIENT_ID
    },
    body: JSON.stringify({
      message,
      sender,
      timestamp: new Date().toISOString()
    })
  });
  
  if (!response.ok) {
    throw new Error(`Brain API error: ${response.status}`);
  }
  
  return response.json();
}

async function restartGateway() {
  logger.info('Restarting gateway...');
  if (sock) {
    await sock.logout();
    sock = null;
  }
  connectionState = 'restarting';
  qrCode = null;
  setTimeout(() => initWhatsApp(), 2000);
}

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clientId: CLIENT_ID,
    port: PORT,
    connectionState,
    qrNeeded: connectionState === 'needs_qr',
    handoffMode,
    timestamp: new Date().toISOString()
  });
});

app.get('/qr', (req, res) => {
  if (!qrCode) {
    return res.json({
      status: 'no_qr',
      message: connectionState === 'connected' ? 'Already connected' : 'No QR code available yet',
      connectionState
    });
  }
  
  res.json({
    status: 'qr_available',
    qr: qrCode,
    connectionState,
    instructions: 'Scan this QR with WhatsApp to connect'
  });
});

app.post('/restart', async (req, res) => {
  await restartGateway();
  res.json({ status: 'restarting', message: 'Gateway restart initiated' });
});

app.post('/handoff/:mode', (req, res) => {
  const mode = req.params.mode;
  if (mode === 'on') {
    handoffMode = true;
    logger.info('Handoff mode enabled');
  } else if (mode === 'off') {
    handoffMode = false;
    logger.info('Handoff mode disabled');
  }
  res.json({ status: 'ok', handoffMode });
});

app.listen(PORT, () => {
  logger.info(`🚀 Client B Gateway listening on port ${PORT}`);
  initWhatsApp();
});

module.exports = { app, sock, restartGateway };
