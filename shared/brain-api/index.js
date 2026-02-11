/**
 * Shared Brain API - Multi-Tenant WhatsApp Receptionist
 * Single API serving multiple clients with tenant isolation
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const tenantRouter = require('./tenant-router');
const tools = require('./tools');

const app = express();
const PORT = process.env.BRAIN_API_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

// Rate limiting per tenant
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each tenant to 100 requests per windowMs
  keyGenerator: (req) => req.headers['x-client-id'] || 'unknown',
  message: 'Too many requests from this client'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging with client ID
app.use((req, res, next) => {
  const clientId = req.headers['x-client-id'] || 'unknown';
  console.log(`[${new Date().toISOString()}] [${clientId}] ${req.method} ${req.path}`);
  req.tenant = { clientId };
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'brain-api',
    tenant: req.tenant.clientId,
    timestamp: new Date().toISOString()
  });
});

// Tenant router handles all client-specific routing
app.use('/api', tenantRouter);

// Tool endpoints (shared across tenants)
app.use('/api/tools', tools);

// Error handling
app.use((err, req, res, next) => {
  console.error(`[${req.tenant?.clientId || 'unknown'}] Error:`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    clientId: req.tenant?.clientId,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    clientId: req.tenant?.clientId,
    path: req.path
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🧠 Brain API listening on port ${PORT}`);
    console.log(`🧠 Multi-tenant mode: ACTIVE`);
  });
}

module.exports = app;
