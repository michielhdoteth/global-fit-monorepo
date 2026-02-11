import QRCode from 'qrcode';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class QRHandler {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.currentQR = null;
    this.qrTimestamp = null;
  }

  async generateQRCode(qrString) {
    try {
      const qrDataURL = await QRCode.toDataURL(qrString, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      this.currentQR = qrDataURL;
      this.qrTimestamp = new Date().toISOString();

      logger.info('QR code generated successfully');
      return qrDataURL;
    } catch (error) {
      logger.error({ error }, 'Failed to generate QR code');
      throw error;
    }
  }

  getQRCode() {
    return {
      qr: this.currentQR,
      timestamp: this.qrTimestamp,
      needsQR: this.sessionManager.needsQR()
    };
  }

  clearQR() {
    this.currentQR = null;
    this.qrTimestamp = null;
    logger.info('QR code cleared');
  }

  renderHTML(qrDataURL) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp QR Code</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 24px;
    }
    .status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .status.connected {
      background: #d4edda;
      color: #155724;
    }
    .status.needs-qr {
      background: #fff3cd;
      color: #856404;
    }
    .status.disconnected {
      background: #f8d7da;
      color: #721c24;
    }
    .qr-container {
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .qr-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    .instructions {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #25D366;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 5px;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #128C7E;
    }
    .btn-restart {
      background: #667eea;
    }
    .btn-restart:hover {
      background: #5568d3;
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📱 WhatsApp Receptionist</h1>
    
    <div id="status-badge" class="status needs-qr">
      Needs QR Code
    </div>
    
    <div class="qr-container" id="qr-container">
      ${qrDataURL ? `<img src="${qrDataURL}" alt="QR Code" class="qr-image" />` : '<p>No QR code available</p>'}
    </div>
    
    <div class="instructions">
      <p>Scan this QR code with WhatsApp to link your device</p>
      <p>Open WhatsApp → Settings → Linked Devices → Link a Device</p>
    </div>
    
    <button class="btn btn-restart" onclick="location.reload()">🔄 Refresh Status</button>
  </div>

  <script>
    // Auto-refresh every 5 seconds when QR is needed
    const statusBadge = document.getElementById('status-badge');
    if (statusBadge.classList.contains('needs-qr')) {
      setTimeout(() => location.reload(), 5000);
    }
  </script>
</body>
</html>
    `;
  }

  renderConnectedHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Connected</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    .emoji {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 24px;
    }
    .status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
      background: #d4edda;
      color: #155724;
    }
    .info {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #25D366;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 5px;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-restart {
      background: #667eea;
    }
    .btn-restart:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="emoji">✅</div>
    <h1>WhatsApp Connected</h1>
    <div class="status">Connected</div>
    <div class="info">
      <p>Your WhatsApp receptionist is now active and ready to handle messages.</p>
    </div>
    <button class="btn btn-restart" onclick="location.reload()">🔄 Refresh Status</button>
  </div>
</body>
</html>
    `;
  }
}

export default QRHandler;
