/**
 * QR Handler - Client A
 * Manages QR code storage and retrieval
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const QR_DIR = path.join(__dirname, '../config/qr-codes');

/**
 * Ensure QR directory exists
 */
function ensureQRDir() {
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }
}

/**
 * Save QR code to file
 */
function saveQR(clientId, qrData) {
  ensureQRDir();
  
  const filename = `${clientId}-${Date.now()}.png`;
  const filepath = path.join(QR_DIR, filename);
  
  // Generate QR code image
  QRCode.toFile(filepath, qrData, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  }, (err) => {
    if (err) {
      console.error(`[${clientId}] Failed to save QR code:`, err);
    } else {
      console.log(`[${clientId}] QR code saved: ${filename}`);
    }
  });
  
  // Also save as JSON for API access
  const jsonPath = path.join(QR_DIR, `${clientId}-latest.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    qr: qrData,
    filename,
    timestamp: new Date().toISOString()
  }));
  
  return filename;
}

/**
 * Get latest QR code for client
 */
function getLatestQR(clientId) {
  const jsonPath = path.join(QR_DIR, `${clientId}-latest.json`);
  
  if (!fs.existsSync(jsonPath)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`[${clientId}] Failed to read QR code:`, err);
    return null;
  }
}

/**
 * Get QR code image path
 */
function getQRImagePath(clientId) {
  const jsonPath = path.join(QR_DIR, `${clientId}-latest.json`);
  
  if (!fs.existsSync(jsonPath)) {
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return path.join(QR_DIR, data.filename);
  } catch (err) {
    return null;
  }
}

/**
 * Clean old QR codes (keep only latest 5)
 */
function cleanOldQRCodes(clientId) {
  ensureQRDir();
  
  const files = fs.readdirSync(QR_DIR)
    .filter(f => f.startsWith(clientId) && f.endsWith('.png'))
    .sort()
    .reverse();
  
  if (files.length > 5) {
    files.slice(5).forEach(file => {
      fs.unlinkSync(path.join(QR_DIR, file));
    });
  }
}

module.exports = {
  saveQR,
  getLatestQR,
  getQRImagePath,
  cleanOldQRCodes
};
