import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

class WhatsAppDatabase {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async initialize() {
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Connect to database
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');

    // Read and execute schema
    const schemaPath = path.join(path.dirname(this.dbPath), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
    } else {
      throw new Error('Schema file not found');
    }

    console.log('Database initialized successfully');
  }

  // Business Profile Operations
  getBusinessProfile() {
    const stmt = this.db.prepare('SELECT * FROM business_profiles WHERE id = 1');
    return stmt.get();
  }

  updateBusinessProfile(data) {
    const stmt = this.db.prepare(`
      UPDATE business_profiles 
      SET name = ?, description = ?, phone = ?, email = ?, address = ?, 
          out_of_hours_message = ?, welcome_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);
    return stmt.run(
      data.name,
      data.description,
      data.phone,
      data.email,
      data.address,
      data.outOfHoursMessage,
      data.welcomeMessage
    );
  }

  // Business Hours Operations
  getBusinessHours() {
    const stmt = this.db.prepare('SELECT * FROM business_hours');
    const rows = stmt.all();
    
    const hours = {};
    for (const row of rows) {
      hours[row.day_of_week] = {
        open: row.open_hour,
        close: row.close_hour,
        isClosed: !!row.is_closed
      };
    }
    
    return hours;
  }

  updateBusinessHours(day, hours) {
    const stmt = this.db.prepare(`
      UPDATE business_hours 
      SET open_hour = ?, close_hour = ?, is_closed = ?
      WHERE day_of_week = ?
    `);
    return stmt.run(hours.open, hours.close, hours.isClosed ? 1 : 0, day);
  }

  // Conversation Operations
  storeConversation(phoneNumber, role, message) {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (phone_number, role, message)
      VALUES (?, ?, ?)
    `);
    return stmt.run(phoneNumber, role, message);
  }

  getConversationHistory(phoneNumber, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations 
      WHERE phone_number = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    const rows = stmt.all(phoneNumber, limit);
    return rows.reverse(); // Return in chronological order
  }

  getRecentConversations(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT DISTINCT phone_number, MAX(timestamp) as last_message
      FROM conversations
      GROUP BY phone_number
      ORDER BY last_message DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  // Escalation Contacts Operations
  getEscalationContacts() {
    const stmt = this.db.prepare('SELECT * FROM escalation_contacts WHERE is_active = 1');
    return stmt.all();
  }

  addEscalationContact(contact) {
    const stmt = this.db.prepare(`
      INSERT INTO escalation_contacts (name, phone, email, role)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(contact.name, contact.phone, contact.email, contact.role);
  }

  // Settings Operations
  getSetting(key) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
  }

  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(key, value);
  }

  // Statistics
  getStatistics() {
    const totalConversations = this.db.prepare('SELECT COUNT(DISTINCT phone_number) as count FROM conversations').get();
    const totalMessages = this.db.prepare('SELECT COUNT(*) as count FROM conversations').get();
    const messagesToday = this.db.prepare(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE DATE(timestamp) = DATE('now')
    `).get();

    return {
      totalConversations: totalConversations.count,
      totalMessages: totalMessages.count,
      messagesToday: messagesToday.count
    };
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default WhatsAppDatabase;
