/**
 * Database Helper - Fusion Galeria
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
    console.log('[Fusion Galeria] Database initialized from schema');
  } else {
    console.warn('[Fusion Galeria] Schema file not found');
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
      SET name = ?, description = ?, address = ?, phone = ?, email = ?,
          services_list = ?, pricing_info = ?
      WHERE id = 1
    `);
    stmt.run(
      data.name, data.description, data.address, 
      data.phone, data.email, data.services_list, data.pricing_info
    );
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
  },
  
  addEscalation: (data) => {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO escalations (reason, message, sender, timestamp, status, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.reason, data.message, data.sender, 
      data.timestamp, data.status, data.priority
    );
    db.close();
    return result.lastInsertRowid;
  }
};

module.exports = {
  getDB,
  initDB,
  profileQueries,
  conversationQueries,
  hoursQueries,
  escalationQueries
};
