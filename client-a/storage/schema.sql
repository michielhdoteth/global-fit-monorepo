-- Client A Database Schema

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  state TEXT NOT NULL,
  qr_code TEXT,
  connected_at TEXT,
  disconnected_at TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Business profile
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

-- Operating hours
CREATE TABLE IF NOT EXISTS operating_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL UNIQUE,
  is_open INTEGER DEFAULT 1,
  open_time TEXT DEFAULT '09:00',
  close_time TEXT DEFAULT '17:00'
);

-- Escalation contacts
CREATE TABLE IF NOT EXISTS escalation_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT,
  is_primary INTEGER DEFAULT 0
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  sender TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  tool_used TEXT
);

-- Escalations
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);

-- Default business profile
INSERT OR IGNORE INTO business_profile (name, description, address, phone, email)
VALUES ('Client A', 'Your Business Description', '123 Main St', '+1234567890', 'contact@example.com');

-- Default operating hours
INSERT OR IGNORE INTO operating_hours (day, is_open, open_time, close_time) VALUES
('Monday', 1, '09:00', '17:00'),
('Tuesday', 1, '09:00', '17:00'),
('Wednesday', 1, '09:00', '17:00'),
('Thursday', 1, '09:00', '17:00'),
('Friday', 1, '09:00', '17:00'),
('Saturday', 0, '09:00', '13:00'),
('Sunday', 0, '09:00', '13:00');

-- Default escalation contact
INSERT OR IGNORE INTO escalation_contacts (name, phone, role, is_primary)
VALUES ('Support Team', '+1234567890', 'Support', 1);
