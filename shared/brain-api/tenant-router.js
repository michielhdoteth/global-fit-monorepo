/**
 * Tenant Router - Routes requests to correct client context
 * Uses X-Client-ID header to determine which client's DB to query
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// Tenant configuration
const TENANT_CONFIG = {
  'client-a': {
    name: 'Client A',
    port: 2900,
    dbPath: path.join(__dirname, '../../client-a/storage/db.sqlite3'),
    envPath: path.join(__dirname, '../../client-a/config/client-a.env')
  },
  'client-b': {
    name: 'Client B',
    port: 2901,
    dbPath: path.join(__dirname, '../../client-b/storage/db.sqlite3'),
    envPath: path.join(__dirname, '../../client-b/config/client-b.env')
  },
  'client-c': {
    name: 'Client C',
    port: 2902,
    dbPath: path.join(__dirname, '../../client-c/storage/db.sqlite3'),
    envPath: path.join(__dirname, '../../client-c/config/client-c.env')
  }
};

// Middleware to validate and load tenant context
const loadTenantContext = (req, res, next) => {
  const clientId = req.headers['x-client-id'];
  
  if (!clientId) {
    return res.status(400).json({ 
      error: 'X-Client-ID header is required',
      validClients: Object.keys(TENANT_CONFIG)
    });
  }
  
  const tenant = TENANT_CONFIG[clientId];
  
  if (!tenant) {
    return res.status(404).json({ 
      error: `Unknown client ID: ${clientId}`,
      validClients: Object.keys(TENANT_CONFIG)
    });
  }
  
  // Attach tenant context to request
  req.tenant = {
    ...tenant,
    id: clientId
  };
  
  next();
};

// Apply tenant context middleware to all routes
router.use(loadTenantContext);

/**
 * Main chat/receptionist endpoint
 * POST /api/chat
 * Body: { message, sender, timestamp }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sender, timestamp } = req.body;
    const tenant = req.tenant;
    
    // Load client's business profile from their DB
    const businessProfile = await loadBusinessProfile(tenant.dbPath);
    
    // Generate response using shared tools with tenant context
    const response = await generateResponse(message, businessProfile, tenant);
    
    // Log conversation to tenant's DB
    await logConversation(tenant.dbPath, {
      message,
      response: response.text,
      sender,
      timestamp: timestamp || new Date().toISOString(),
      toolUsed: response.toolUsed
    });
    
    res.json({
      response: response.text,
      toolUsed: response.toolUsed,
      tenantId: tenant.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`[${req.tenant.id}] Chat error:`, error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
});

/**
 * Get tenant business profile
 * GET /api/profile
 */
router.get('/profile', async (req, res) => {
  try {
    const businessProfile = await loadBusinessProfile(req.tenant.dbPath);
    res.json({
      tenantId: req.tenant.id,
      profile: businessProfile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get conversation history for tenant
 * GET /api/conversations?limit=50
 */
router.get('/conversations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const conversations = await getConversations(req.tenant.dbPath, limit);
    res.json({
      tenantId: req.tenant.id,
      conversations,
      count: conversations.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check for tenant
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tenantId: req.tenant.id,
    tenantName: req.tenant.name,
    gatewayPort: req.tenant.port,
    timestamp: new Date().toISOString()
  });
});

// --- Helper Functions ---

async function loadBusinessProfile(dbPath) {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath, { readonly: true });
  
  try {
    const profile = db.prepare('SELECT * FROM business_profile WHERE id = 1').get();
    const hours = db.prepare('SELECT * FROM operating_hours').all();
    const escalation = db.prepare('SELECT * FROM escalation_contacts').all();
    
    return {
      ...profile,
      operatingHours: hours,
      escalationContacts: escalation
    };
  } finally {
    db.close();
  }
}

async function generateResponse(message, profile, tenant) {
  const tools = require('./tools');
  
  // Check operating hours
  const isOpen = tools.booking.checkOperatingHours(profile.operatingHours);
  
  // Determine which tool to use based on message content
  const tool = tools.selectTool(message, profile, isOpen);
  
  // Execute tool with tenant context
  const response = await tool.execute(message, profile, tenant);
  
  return response;
}

async function logConversation(dbPath, data) {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  
  try {
    const stmt = db.prepare(`
      INSERT INTO conversations (message, response, sender, timestamp, tool_used)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(data.message, data.response, data.sender, data.timestamp, data.toolUsed);
  } finally {
    db.close();
  }
}

async function getConversations(dbPath, limit) {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath, { readonly: true });
  
  try {
    const stmt = db.prepare(`
      SELECT * FROM conversations 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  } finally {
    db.close();
  }
}

module.exports = router;
