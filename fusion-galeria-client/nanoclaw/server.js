/**
 * NanoClaw Server - Fusion Galeria
 * Dedicated AI Receptionist for Fusion Galeria
 * Port: 3001
 */

require('dotenv').config({ path: '../config/fusion-galeria.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const messageRouter = require('./message-router');
const { initDB } = require('../storage/db');

const app = express();
const PORT = process.env.NANOCLAW_PORT || 3001;
const CLIENT_NAME = 'Fusion Galeria';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] [${CLIENT_NAME}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'nanoclaw',
    client: CLIENT_NAME,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Message router handles all incoming messages
app.use('/api', messageRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', client: CLIENT_NAME });
});

// Initialize database and start server
async function start() {
  try {
    await initDB();
    console.log(`✅ [${CLIENT_NAME}] Database initialized`);
    
    app.listen(PORT, () => {
      console.log(`🚀 [${CLIENT_NAME}] NanoClaw listening on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ [${CLIENT_NAME}] Failed to start:`, error);
    process.exit(1);
  }
}

start();
