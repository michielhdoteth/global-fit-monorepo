/**
 * Connection Watcher - Monitors all client gateway connections
 * Runs as a background service checking gateway health
 */

const http = require('http');
const TENANT_CONFIG = require('../brain-api/tenant-router').TENANT_CONFIG || {
  'client-a': { port: 2900, name: 'Client A' },
  'client-b': { port: 2901, name: 'Client B' },
  'client-c': { port: 2902, name: 'Client C' }
};

const CHECK_INTERVAL = 30000; // 30 seconds
const TIMEOUT = 5000; // 5 seconds

// Connection state tracking
const connectionStates = {};

/**
 * Initialize connection states
 */
function initializeStates() {
  Object.keys(TENANT_CONFIG).forEach(clientId => {
    connectionStates[clientId] = {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      lastConnected: null
    };
  });
}

/**
 * Check if a gateway is responding
 */
function checkGateway(clientId, port) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      const responseTime = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            resolve({
              success: true,
              responseTime,
              status: health.status,
              qrNeeded: health.qr_needed || false
            });
          } catch {
            resolve({ success: true, responseTime });
          }
        });
      } else {
        resolve({ success: false, statusCode: res.statusCode });
      }
    });
    
    req.on('error', () => {
      resolve({ success: false, error: 'Connection refused' });
    });
    
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

/**
 * Update connection state for a client
 */
async function updateConnectionState(clientId) {
  const tenant = TENANT_CONFIG[clientId];
  if (!tenant) return;
  
  const check = await checkGateway(clientId, tenant.port);
  const previousState = connectionStates[clientId];
  const now = new Date().toISOString();
  
  console.log(`[${now}] [${clientId}] Gateway check: ${check.success ? 'OK' : 'FAILED'} (${check.responseTime || 'N/A'}ms)`);
  
  if (check.success) {
    // Connection is good
    if (previousState.status !== 'connected') {
      console.log(`[${clientId}] ✅ Connected`);
    }
    
    connectionStates[clientId] = {
      status: 'connected',
      lastCheck: now,
      consecutiveFailures: 0,
      lastConnected: now,
      qrNeeded: check.qrNeeded
    };
  } else {
    // Connection failed
    connectionStates[clientId] = {
      status: 'disconnected',
      lastCheck: now,
      consecutiveFailures: previousState.consecutiveFailures + 1,
      lastConnected: previousState.lastConnected,
      error: check.error
    };
    
    console.log(`[${clientId}] ❌ Disconnected (Failures: ${connectionStates[clientId].consecutiveFailures})`);
    
    // Trigger alert after 3 consecutive failures
    if (connectionStates[clientId].consecutiveFailures >= 3) {
      const alertSender = require('./alert-sender');
      alertSender.sendConnectionAlert(clientId, tenant, connectionStates[clientId]);
    }
  }
}

/**
 * Check all gateways
 */
async function checkAllGateways() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Checking all gateway connections...`);
  console.log(`${'='.repeat(50)}`);
  
  const checks = Object.keys(TENANT_CONFIG).map(clientId => 
    updateConnectionState(clientId)
  );
  
  await Promise.allSettled(checks);
  
  printStatusSummary();
}

/**
 * Print status summary
 */
function printStatusSummary() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`CONNECTION STATUS SUMMARY`);
  console.log(`${'='.repeat(50)}`);
  
  Object.entries(connectionStates).forEach(([clientId, state]) => {
    const statusEmoji = state.status === 'connected' ? '✅' : '❌';
    const lastSeen = state.lastConnected ? new Date(state.lastConnected).toLocaleString() : 'Never';
    
    console.log(`${statusEmoji} ${clientId}: ${state.status.toUpperCase()}`);
    console.log(`   Last seen: ${lastSeen}`);
    console.log(`   Failures: ${state.consecutiveFailures}`);
    if (state.qrNeeded) {
      console.log(`   ⚠️ QR Code needed!`);
    }
    console.log();
  });
}

/**
 * Get current status for all clients
 */
function getStatus() {
  return connectionStates;
}

/**
 * Get status for a specific client
 */
function getClientStatus(clientId) {
  return connectionStates[clientId];
}

/**
 * Manually trigger a check for a specific client
 */
async function triggerCheck(clientId) {
  return updateConnectionState(clientId);
}

/**
 * Start the connection watcher
 */
function start() {
  initializeStates();
  
  console.log(`🔍 Connection Watcher starting...`);
  console.log(`   Check interval: ${CHECK_INTERVAL / 1000}s`);
  console.log(`   Monitoring clients: ${Object.keys(TENANT_CONFIG).join(', ')}`);
  
  // Initial check
  checkAllGateways();
  
  // Periodic checks
  const interval = setInterval(checkAllGateways, CHECK_INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    clearInterval(interval);
    console.log('Connection watcher stopped');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('Connection watcher stopped');
    process.exit(0);
  });
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--status') || args.includes('-s')) {
    initializeStates();
    checkAllGateways().then(() => process.exit(0));
  } else if (args.includes('--once')) {
    initializeStates();
    checkAllGateways().then(() => process.exit(0));
  } else {
    start();
  }
}

module.exports = {
  start,
  checkAllGateways,
  triggerCheck,
  getStatus,
  getClientStatus
};
