/**
 * Session Manager - Client A
 * Manages session state in the client's SQLite database
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../storage/db.sqlite3');

/**
 * Initialize database schema if needed
 */
function initDB() {
  const db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      state TEXT NOT NULL,
      qr_code TEXT,
      connected_at TEXT,
      disconnected_at TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      tool_used TEXT
    );
    
    CREATE TABLE IF NOT EXISTS business_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      services_list TEXT,
      pricing_info TEXT,
      payment_methods TEXT,
      emergency_phone TEXT,
      response_time TEXT DEFAULT '30 minutes'
    );
    
    CREATE TABLE IF NOT EXISTS operating_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL UNIQUE,
      is_open INTEGER DEFAULT 1,
      open_time TEXT DEFAULT '09:00',
      close_time TEXT DEFAULT '17:00'
    );
    
    CREATE TABLE IF NOT EXISTS escalation_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT,
      is_primary INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reason TEXT NOT NULL,
      message TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      resolved_at TEXT
    );
  `);
  
  // Insert default business profile if not exists
  const existing = db.prepare('SELECT COUNT(*) as count FROM business_profile').get();
  if (existing.count === 0) {
    db.prepare(`
      INSERT INTO business_profile (name, description, address, phone, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('Client A', 'Your Business Description', '123 Main St', '+1234567890', 'contact@example.com');
  }
  
  db.close();
}

/**
 * Update session state in database
 */
function updateSessionState(dbPath, clientId, state, qrCode = null) {
  const db = new Database(dbPath);
  
  const now = new Date().toISOString();
  
  const updateData = {
    client_id: clientId,
    state,
    qr_code: qrCode,
    connected_at: state === 'connected' ? now : null,
    disconnected_at: state === 'disconnected' ? now : null,
    updated_at: now
  };
  
  db.prepare(`
    INSERT INTO sessions (client_id, state, qr_code, connected_at, disconnected_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    updateData.client_id,
    updateData.state,
    updateData.qr_code,
    updateData.connected_at,
    updateData.disconnected_at,
    updateData.updated_at
  );
  
  db.close();
}

/**
 * Get current session state
 */
function getSessionState(dbPath, clientId) {
  const db = new Database(dbPath, { readonly: true });
  
  const session = db.prepare(`
    SELECT * FROM sessions 
    WHERE client_id = ? 
    ORDER BY id DESC 
    LIMIT 1
  `).get(clientId);
  
  db.close();
  return session;
}

/**
 * Get session history
 */
function getSessionHistory(dbPath, clientId, limit = 10) {
  const db = new Database(dbPath, { readonly: true });
  
  const sessions = db.prepare(`
    SELECT * FROM sessions 
    WHERE client_id = ? 
    ORDER BY id DESC 
    LIMIT ?
  `).all(clientId, limit);
  
  db.close();
  return sessions;
}

// Initialize on module load
initDB();

module.exports = {
  initDB,
  updateSessionState,
  getSessionState,
  getSessionHistory
};
