/**
 * Tools Index - Exports all tools and selection logic
 */

const express = require('express');
const router = express.Router();

const booking = require('./booking');
const faq = require('./faq');
const escalation = require('./escalation');

/**
 * Select appropriate tool based on message content and context
 */
function selectTool(message, profile, isOpen) {
  // Priority 1: Emergency escalation
  if (escalation.isEmergency(message, profile)) {
    return escalation;
  }
  
  // Priority 2: Booking-related messages
  const bookingKeywords = [
    /(?:book|schedule|appointment|reserve|availability)/i,
    /(?:when.*available|free.*time|open.*slot)/i
  ];
  
  if (bookingKeywords.some(kw => kw.test(message))) {
    return booking;
  }
  
  // Priority 3: Customer request for escalation
  if (escalation.requiresEscalation(message, profile)) {
    return escalation;
  }
  
  // Default: FAQ/General questions
  return faq;
}

/**
 * Execute tool selection and return response
 */
async function executeTool(message, profile, tenant, forceTool = null) {
  const isOpen = booking.checkOperatingHours(profile.operatingHours);
  const tool = forceTool || selectTool(message, profile, isOpen);
  
  const result = await tool.execute(message, profile, tenant);
  
  // If tool returns null text, try FAQ as fallback
  if (!result.text && tool !== faq) {
    const faqResult = await faq.execute(message, profile, tenant);
    return faqResult;
  }
  
  return result;
}

// Express routes for direct tool access
router.get('/list', (req, res) => {
  res.json({
    tools: ['booking', 'faq', 'escalation'],
    description: 'Shared tools available for all tenants'
  });
});

router.post('/execute', async (req, res) => {
  try {
    const { message, profile, tenant, tool } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await executeTool(message, profile, tenant, tool);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  booking,
  faq,
  escalation,
  selectTool,
  executeTool,
  router
};
