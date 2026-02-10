-- Fusion Galeria Database Schema

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
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);

-- Default business profile for Fusion Galeria
INSERT OR IGNORE INTO business_profile (name, description, address, phone, email, services_list, pricing_info)
VALUES (
  'Fusion Galeria',
  'Premier art gallery showcasing contemporary and traditional artwork',
  '123 Art District Ave, Creative City, CC 12345',
  '+1234567890',
  'info@fusiongaleria.com',
  '• Art exhibitions\n• Private viewings\n• Art consultations\n• Custom commissions\n• Artist workshops',
  'Free admission to exhibitions\nPrivate viewings: $50\nArt consultations: $75/hour\nCustom pieces: varies by artist'
);

-- Default operating hours
INSERT OR IGNORE INTO operating_hours (day, is_open, open_time, close_time) VALUES
('Monday', 1, '10:00', '18:00'),
('Tuesday', 1, '10:00', '18:00'),
('Wednesday', 1, '10:00', '18:00'),
('Thursday', 1, '10:00', '18:00'),
('Friday', 1, '10:00', '18:00'),
('Saturday', 1, '11:00', '19:00'),
('Sunday', 1, '12:00', '17:00');

-- Default escalation contacts
INSERT OR IGNORE INTO escalation_contacts (name, phone, role, is_primary)
VALUES ('Gallery Manager', '+1234567890', 'Management', 1);
