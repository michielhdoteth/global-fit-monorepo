-- Business profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  out_of_hours_message TEXT DEFAULT 'Thank you for your message! We are currently outside of business hours.',
  welcome_message TEXT DEFAULT 'Hello! Welcome to our business. How can I help you today?',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Business hours configuration
CREATE TABLE IF NOT EXISTS business_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week TEXT NOT NULL, -- monday, tuesday, etc.
  open_hour INTEGER NOT NULL, -- 0-23
  close_hour INTEGER NOT NULL, -- 0-23
  is_closed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_of_week)
);

-- Conversation logs
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_timestamp (phone_number, timestamp)
);

-- Escalation contacts
CREATE TABLE IF NOT EXISTS escalation_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL, -- 'owner', 'manager', 'support'
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default business profile
INSERT OR IGNORE INTO business_profiles (name, description, welcome_message) 
VALUES (
  'My Business',
  'Welcome to our business!',
  'Hello! Welcome to our business. How can I help you today?'
);

-- Default business hours (9 AM - 6 PM, Monday to Friday)
INSERT OR IGNORE INTO business_hours (day_of_week, open_hour, close_hour, is_closed) VALUES
  ('monday', 9, 18, 0),
  ('tuesday', 9, 18, 0),
  ('wednesday', 9, 18, 0),
  ('thursday', 9, 18, 0),
  ('friday', 9, 18, 0),
  ('saturday', 0, 0, 1),
  ('sunday', 0, 0, 1);

-- Default escalation contacts
INSERT OR IGNORE INTO escalation_contacts (name, phone, email, role) VALUES
  ('Business Owner', '+1234567890', 'owner@example.com', 'owner');

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('handoff_mode', 'false'),
  ('auto_reply_enabled', 'true');
