/**
 * Response Router - Fusion Galeria
 * Routes responses based on action type
 */

const { escalationQueries } = require('../storage/db');

/**
 * Main response router
 */
async function responseRouter(result) {
  const { action, response, requiresHuman } = result;
  
  switch (action) {
    case 'greet':
    case 'provide_info':
      return {
        response,
        action,
        toolUsed: 'knowledge_base'
      };
      
    case 'escalate':
      // Log escalation if human assistance needed
      if (requiresHuman) {
        await logEscalation(result);
        return {
          response,
          action,
          toolUsed: 'escalation',
          escalated: true
        };
      }
      return {
        response,
        action,
        toolUsed: 'escalation'
      };
      
    case 'error':
      return {
        response,
        action,
        toolUsed: 'error_handler'
      };
      
    default:
      return {
        response,
        action: 'unknown',
        toolUsed: 'default'
      };
  }
}

/**
 * Log escalation to database
 */
async function logEscalation(result) {
  try {
    await escalationQueries.addEscalation({
      reason: 'human_assistance_required',
      message: result.response,
      sender: result.sender,
      timestamp: result.timestamp,
      priority: 'normal'
    });
    console.log('[Fusion Galeria] Escalation logged');
  } catch (error) {
    console.error('[Fusion Galeria] Failed to log escalation:', error);
  }
}

module.exports = { responseRouter };
