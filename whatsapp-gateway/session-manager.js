import fs from 'fs';
import path from 'path';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class SessionManager {
  constructor(sessionPath) {
    this.sessionPath = sessionPath;
    this.sessions = new Map();
    this.connectionStates = new Map();
  }

  ensureSessionDir() {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  getSessionId(sessionId = 'default') {
    return sessionId;
  }

  getSessionPath(sessionId) {
    const id = this.getSessionId(sessionId);
    return path.join(this.sessionPath, id);
  }

  saveAuthState(sessionId, authState) {
    const sessionDir = this.getSessionPath(sessionId);
    this.ensureSessionDir();
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const credsFile = path.join(sessionDir, 'creds.json');
    fs.writeFileSync(credsFile, JSON.stringify(authState.creds, null, 2));
  }

  loadAuthState(sessionId) {
    const sessionDir = this.getSessionPath(sessionId);
    const credsFile = path.join(sessionDir, 'creds.json');

    if (!fs.existsSync(credsFile)) {
      return null;
    }

    try {
      const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
      return { creds };
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to load auth state');
      return null;
    }
  }

  deleteSession(sessionId) {
    const sessionDir = this.getSessionPath(sessionId);
    
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    this.sessions.delete(sessionId);
    this.connectionStates.delete(sessionId);
    
    logger.info({ sessionId }, 'Session deleted');
  }

  setConnectionState(sessionId, state) {
    const stateInfo = {
      state,
      timestamp: new Date().toISOString()
    };
    this.connectionStates.set(sessionId, stateInfo);
    logger.info({ sessionId, state }, 'Connection state updated');
  }

  getConnectionState(sessionId) {
    return this.connectionStates.get(sessionId) || { state: 'disconnected', timestamp: null };
  }

  isLinked(sessionId) {
    const state = this.getConnectionState(sessionId);
    return state.state === 'connected';
  }

  needsQR(sessionId) {
    const state = this.getConnectionState(sessionId);
    return state.state === 'needs_qr';
  }

  getAllSessions() {
    return Array.from(this.sessions.keys());
  }

  getAllConnectionStates() {
    const states = {};
    for (const [sessionId, stateInfo] of this.connectionStates.entries()) {
      states[sessionId] = stateInfo;
    }
    return states;
  }
}

export default SessionManager;
