import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class ConnectionWatcher {
  constructor(sessionManager, alertSender, checkIntervalMs = 30000) {
    this.sessionManager = sessionManager;
    this.alertSender = alertSender;
    this.checkIntervalMs = checkIntervalMs;
    this.intervalId = null;
    this.lastKnownState = null;
    this.alertCooldown = new Map(); // sessionId -> last alert time
  }

  start() {
    if (this.intervalId) {
      logger.warn('Connection watcher already running');
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkConnections();
    }, this.checkIntervalMs);

    logger.info({ interval: this.checkIntervalMs }, 'Connection watcher started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Connection watcher stopped');
    }
  }

  async checkConnections() {
    try {
      const sessions = this.sessionManager.getAllSessions();
      
      for (const sessionId of sessions) {
        const state = this.sessionManager.getConnectionState(sessionId);
        await this.checkSessionState(sessionId, state);
      }
    } catch (error) {
      logger.error({ error }, 'Error checking connections');
    }
  }

  async checkSessionState(sessionId, state) {
    const currentState = state.state;
    const timestamp = state.timestamp;

    // Skip if no change
    if (this.lastKnownState === currentState && currentState === 'connected') {
      return;
    }

    // Check for QR needed state (logged out)
    if (currentState === 'needs_qr') {
      const now = Date.now();
      const lastAlert = this.alertCooldown.get(sessionId) || 0;
      const cooldownMs = 5 * 60 * 1000; // 5 minutes

      if (now - lastAlert > cooldownMs) {
        await this.alertSender.sendAlert(
          `🚨 WhatsApp Disconnected - QR Code Needed`,
          `Session: ${sessionId}\nTimestamp: ${timestamp}\n\nPlease scan QR code at /qr endpoint to reconnect.`
        );
        this.alertCooldown.set(sessionId, now);
      }
    }

    // Check for disconnected state
    if (currentState === 'disconnected') {
      const now = Date.now();
      const lastAlert = this.alertCooldown.get(sessionId) || 0;
      const cooldownMs = 3 * 60 * 1000; // 3 minutes

      if (now - lastAlert > cooldownMs) {
        await this.alertSender.sendAlert(
          `⚠️ WhatsApp Connection Lost`,
          `Session: ${sessionId}\nTimestamp: ${timestamp}\n\nAttempting to reconnect...`
        );
        this.alertCooldown.set(sessionId, now);
      }
    }

    // Log state changes
    if (this.lastKnownState !== currentState) {
      logger.info({ sessionId, previousState: this.lastKnownState, currentState }, 'Connection state changed');
      this.lastKnownState = currentState;
    }
  }

  // Manually trigger a check
  async checkNow() {
    await this.checkConnections();
  }
}

export default ConnectionWatcher;
