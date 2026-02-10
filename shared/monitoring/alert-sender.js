/**
 * Alert Sender - Sends notifications for client-specific events
 * Supports Telegram, SMS, and email alerts
 */

const https = require('https');
const TENANT_CONFIG = require('../brain-api/tenant-router').TENANT_CONFIG || {
  'client-a': { name: 'Client A', port: 2900 },
  'client-b': { name: 'Client B', port: 2901 },
  'client-c': { name: 'Client C', port: 2902 }
};

// Load alert configuration from environment
const ALERT_CONFIG = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatIds: process.env.TELEGRAM_CHAT_IDS?.split(',') || []
  },
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'twilio',
    from: process.env.SMS_FROM_NUMBER,
    recipients: process.env.SMS_RECIPIENTS?.split(',') || []
  }
};

/**
 * Format alert message with client identifier
 */
function formatAlertMessage(clientId, tenant, event, details) {
  const timestamp = new Date().toISOString();
  const emoji = event.emoji || '⚠️';
  
  let message = `${emoji} [${tenant.name.toUpperCase()}]\n`;
  message += `Event: ${event.title}\n`;
  message += `Time: ${timestamp}\n`;
  
  if (details) {
    message += `\nDetails:\n`;
    Object.entries(details).forEach(([key, value]) => {
      message += `  ${key}: ${value}\n`;
    });
  }
  
  message += `\nClient ID: ${clientId}`;
  
  return message;
}

/**
 * Send Telegram alert
 */
function sendTelegram(clientId, message) {
  if (!ALERT_CONFIG.telegram.botToken || ALERT_CONFIG.telegram.chatIds.length === 0) {
    console.log(`[${clientId}] Telegram not configured, skipping alert`);
    return Promise.resolve({ skipped: true, reason: 'not_configured' });
  }
  
  const promises = ALERT_CONFIG.telegram.chatIds.map(chatId => {
    return new Promise((resolve, reject) => {
      const url = `https://api.telegram.org/bot${ALERT_CONFIG.telegram.botToken}/sendMessage`;
      
      const postData = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      });
      
      const options = {
        hostname: 'api.telegram.org',
        path: `/bot${ALERT_CONFIG.telegram.botToken}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ sent: true, chatId });
          } else {
            reject(new Error(`Telegram API error: ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (error) => {
        console.error(`[${clientId}] Telegram error:`, error.message);
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
  });
  
  return Promise.all(promises);
}

/**
 * Send SMS alert (placeholder for actual SMS provider)
 */
function sendSMS(clientId, message) {
  if (!ALERT_CONFIG.sms.enabled) {
    console.log(`[${clientId}] SMS not enabled, skipping alert`);
    return Promise.resolve({ skipped: true, reason: 'not_enabled' });
  }
  
  // Placeholder for actual SMS implementation
  // Would integrate with Twilio, AWS SNS, etc.
  console.log(`[${clientId}] SMS Alert (not implemented): ${message.substring(0, 100)}...`);
  
  return Promise.resolve({
    sent: false,
    reason: 'not_implemented',
    recipients: ALERT_CONFIG.sms.recipients
  });
}

/**
 * Send connection alert
 */
function sendConnectionAlert(clientId, tenant, state) {
  const event = {
    title: 'Gateway Connection Lost',
    emoji: '🔴'
  };
  
  const details = {
    status: state.status,
    consecutiveFailures: state.consecutiveFailures,
    lastConnected: state.lastConnected || 'Unknown',
    error: state.error || 'No connection',
    port: tenant.port
  };
  
  const message = formatAlertMessage(clientId, tenant, event, details);
  
  console.log(`[${clientId}] Sending connection alert...`);
  
  // Send to both Telegram and SMS
  return Promise.allSettled([
    sendTelegram(clientId, message),
    sendSMS(clientId, message)
  ]);
}

/**
 * Send QR code needed alert
 */
function sendQRNeededAlert(clientId, tenant, qrCode) {
  const event = {
    title: 'QR Code Required',
    emoji: '📱'
  };
  
  const details = {
    status: 'Needs QR',
    qrCode: qrCode.substring(0, 20) + '...',
    port: tenant.port,
    action: `curl http://localhost:${tenant.port}/qr`
  };
  
  const message = formatAlertMessage(clientId, tenant, event, details);
  
  console.log(`[${clientId}] Sending QR needed alert...`);
  
  return Promise.allSettled([
    sendTelegram(clientId, message),
    sendSMS(clientId, message)
  ]);
}

/**
 * Send escalation alert
 */
function sendEscalationAlert(clientId, tenant, escalation) {
  const event = {
    title: 'Customer Escalation',
    emoji: escalation.priority === 'critical' ? '🚨' : '🔄'
  };
  
  const details = {
    priority: escalation.priority,
    reason: escalation.reason,
    message: escalation.message?.substring(0, 100) + '...',
    sender: escalation.sender
  };
  
  const message = formatAlertMessage(clientId, tenant, event, details);
  
  console.log(`[${clientId}] Sending escalation alert...`);
  
  return Promise.allSettled([
    sendTelegram(clientId, message),
    sendSMS(clientId, message)
  ]);
}

/**
 * Send custom alert
 */
function sendCustomAlert(clientId, title, emoji, details) {
  const tenant = TENANT_CONFIG[clientId];
  if (!tenant) {
    console.error(`Unknown client: ${clientId}`);
    return Promise.reject(new Error('Unknown client'));
  }
  
  const event = { title, emoji };
  const message = formatAlertMessage(clientId, tenant, event, details);
  
  return Promise.allSettled([
    sendTelegram(clientId, message),
    sendSMS(clientId, message)
  ]);
}

/**
 * Test alert configuration
 */
async function testAlerts() {
  console.log('Testing alert configuration...\n');
  
  console.log('Telegram:');
  console.log(`  Bot Token: ${ALERT_CONFIG.telegram.botToken ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Chat IDs: ${ALERT_CONFIG.telegram.chatIds.join(', ') || 'None'}\n`);
  
  console.log('SMS:');
  console.log(`  Enabled: ${ALERT_CONFIG.sms.enabled ? '✅ Yes' : '❌ No'}`);
  console.log(`  Provider: ${ALERT_CONFIG.sms.provider}`);
  console.log(`  From: ${ALERT_CONFIG.sms.from || 'Not set'}`);
  console.log(`  Recipients: ${ALERT_CONFIG.sms.recipients.join(', ') || 'None'}\n`);
  
  // Send a test alert if configured
  if (ALERT_CONFIG.telegram.botToken) {
    const testClient = 'client-a';
    try {
      const result = await sendTelegram(testClient, `🧪 Test alert from Connection Watcher\n\nThis is a test to verify alert configuration is working.`);
      console.log('✅ Test alert sent successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Test alert failed:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') || args.includes('-t')) {
    testAlerts();
  } else if (args.includes('--send')) {
    const clientId = args[2];
    const message = args[3] || 'Test message';
    sendCustomAlert(clientId, 'Manual Test', '🧪', { message });
  }
}

module.exports = {
  sendConnectionAlert,
  sendQRNeededAlert,
  sendEscalationAlert,
  sendCustomAlert,
  testAlerts,
  sendTelegram,
  sendSMS
};
