/**
 * Escalation Tool - Shared across all tenants
 * Handles handoffs to human agents, emergency escalation, etc.
 */

module.exports = {
  /**
   * Detect if message requires escalation
   */
  requiresEscalation(message, profile) {
    const escalationTriggers = [
      /(?:speak to|talk to|human|person|agent|representative)/i,
      /(?:manager|supervisor|someone in charge)/i,
      /(?:complaint|problem|issue|not working|broken)/i,
      /(?:frustrated|angry|upset|disappointed)/i,
      /(?:refund|cancel.*subscription|dispute)/i,
      /(?:billing error|wrong charge|chargeback)/i
    ];
    
    return escalationTriggers.some(trigger => trigger.test(message));
  },
  
  /**
   * Detect if message is an emergency
   */
  isEmergency(message, profile) {
    const emergencyTriggers = [
      /(?:emergency|urgent|asap|immediate|right now)/i,
      /(?:dangerous|unsafe|hazard|injury|hurt)/i,
      /(?:fire|flood|leak|break-in|theft)/i,
      /(?:cannot breathe|heart attack|stroke|seizure)/i
    ];
    
    return emergencyTriggers.some(trigger => trigger.test(message));
  },
  
  /**
   * Generate handoff message
   */
  generateHandoff(profile, reason) {
    const contacts = profile.escalationContacts || [];
    
    let message = `🔄 I'm connecting you with a team member...\n\n`;
    
    if (reason) {
      message += `Reason: ${reason}\n\n`;
    }
    
    if (contacts.length > 0) {
      const primary = contacts.find(c => c.is_primary) || contacts[0];
      message += `📞 You can also reach us directly:\n`;
      message += `• ${primary.name}: ${primary.phone}\n`;
      
      if (contacts.length > 1) {
        message += `\nAlternative contacts:\n`;
        contacts.slice(1).forEach(c => {
          message += `• ${c.name}: ${c.phone}\n`;
        });
      }
    }
    
    message += `\n⏱️ Response time: Usually within ${profile.response_time || '30 minutes'} during business hours.`;
    
    return message;
  },
  
  /**
   * Log escalation for monitoring
   */
  async logEscalation(dbPath, data) {
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    
    try {
      const stmt = db.prepare(`
        INSERT INTO escalations (reason, message, sender, timestamp, status, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        data.reason,
        data.message,
        data.sender,
        data.timestamp || new Date().toISOString(),
        'pending',
        data.priority || 'normal'
      );
    } finally {
      db.close();
    }
  },
  
  /**
   * Send alert notification
   */
  async sendAlert(profile, escalation) {
    // This would integrate with the alert-sender
    // For now, just log it
    console.log(`[ESCALATION] ${profile.name}: ${escalation.reason}`);
    console.log(`  Message: ${escalation.message.substring(0, 100)}...`);
    console.log(`  Priority: ${escalation.priority}`);
  },
  
  /**
   * Execute escalation flow
   */
  async execute(message, profile, tenant) {
    // Check for emergency first
    if (this.isEmergency(message, profile)) {
      const emergency = {
        reason: 'Emergency',
        message,
        sender: tenant.sender || 'unknown',
        priority: 'critical',
        timestamp: new Date().toISOString()
      };
      
      await this.logEscalation(tenant.dbPath, emergency);
      await this.sendAlert(profile, emergency);
      
      return {
        text: `🚨 EMERGENCY DETECTED 🚨\n\n` +
              `A team member has been notified and will contact you immediately.\n\n` +
              `If this is a life-threatening emergency, please call emergency services:\n` +
              `• 🚑 Emergency: 911 (or your local emergency number)\n` +
              `• ${profile.emergency_phone || profile.phone || 'Our emergency line'}`,
        toolUsed: 'escalation',
        priority: 'critical',
        status: 'escalated'
      };
    }
    
    // Check for regular escalation
    if (this.requiresEscalation(message, profile)) {
      const escalation = {
        reason: 'Customer request',
        message,
        sender: tenant.sender || 'unknown',
        priority: 'normal',
        timestamp: new Date().toISOString()
      };
      
      await this.logEscalation(tenant.dbPath, escalation);
      await this.sendAlert(profile, escalation);
      
      return {
        text: this.generateHandoff(profile, 'Customer requested to speak with a person'),
        toolUsed: 'escalation',
        priority: 'normal',
        status: 'escalated'
      };
    }
    
    // No escalation needed
    return {
      text: null, // Signal to try another tool
      toolUsed: 'escalation',
      status: 'not_needed'
    };
  }
};
