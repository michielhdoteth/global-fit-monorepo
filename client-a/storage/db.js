/**
 * Database Helper - Client A
 * Provides database connection and queries
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'db.sqlite3');

/**
 * Get database connection
 */
function getDB() {
  return new Database(DB_PATH);
}

/**
 * Initialize database from schema
 */
function initDB() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  if (fs.existsSync(schemaPath)) {
    const db = getDB();
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    db.close();
    console.log('[Client A] Database initialized from schema');
  } else {
    console.warn('[Client A] Schema file not found, creating tables manually');
    const db = getDB();
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
      CREATE TABLE IF NOT EXISTS business_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        phone TEXT,
        email TEXT
      );
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        sender TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        tool_used TEXT
      );
    `);
    db.close();
  }
}

/**
 * Query functions for business profile
 */
const profileQueries = {
  getProfile: () => {
    const db = getDB();
    const profile = db.prepare('SELECT * FROM business_profile WHERE id = 1').get();
    db.close();
    return profile;
  },
  
  updateProfile: (data) => {
    const db = getDB();
    const stmt = db.prepare(`
      UPDATE business_profile 
      SET name = ?, description = ?, address = ?, phone = ?, email = ?
      WHERE id = 1
    `);
    stmt.run(data.name, data.description, data.address, data.phone, data.email);
    db.close();
  }
};

/**
 * Query functions for conversations
 */
const conversationQueries = {
  addConversation: (data) => {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO conversations (message, response, sender, timestamp, tool_used)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(data.message, data.response, data.sender, data.timestamp, data.toolUsed);
    db.close();
    return result.lastInsertRowid;
  },
  
  getConversations: (limit = 50) => {
    const db = getDB({ readonly: true });
    const conversations = db.prepare(`
      SELECT * FROM conversations 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit);
    db.close();
    return conversations;
  },
  
  searchConversations: (query, limit = 20) => {
    const db = getDB({ readonly: true });
    const conversations = db.prepare(`
      SELECT * FROM conversations 
      WHERE message LIKE ? OR response LIKE ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(`%${query}%`, `%${query}%`, limit);
    db.close();
    return conversations;
  }
};

/**
 * Query functions for operating hours
 */
const hoursQueries = {
  getHours: () => {
    const db = getDB({ readonly: true });
    const hours = db.prepare('SELECT * FROM operating_hours ORDER BY id').all();
    db.close();
    return hours;
  },
  
  updateDayHours: (day, isOpen, openTime, closeTime) => {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO operating_hours (day, is_open, open_time, close_time)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(day, isOpen ? 1 : 0, openTime, closeTime);
    db.close();
  }
};

/**
 * Query functions for escalation contacts
 */
const escalationQueries = {
  getContacts: () => {
    const db = getDB({ readonly: true });
    const contacts = db.prepare('SELECT * FROM escalation_contacts').all();
    db.close();
    return contacts;
  },
  
  addContact: (data) => {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO escalation_contacts (name, phone, role, is_primary)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(data.name, data.phone, data.role, data.isPrimary ? 1 : 0);
    db.close();
  }
};

// Initialize database on module load
initDB();

module.exports = {
  getDB,
  initDB,
  profileQueries,
  conversationQueries,
  hoursQueries,
  escalationQueries
};
