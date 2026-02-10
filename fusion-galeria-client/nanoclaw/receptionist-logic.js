/**
 * Receptionist Logic - Fusion Galeria
 * AI-powered business logic for handling customer inquiries
 */

const { profileQueries, hoursQueries } = require('../storage/db');

/**
 * Analyze message and determine intent
 */
async function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Intent detection patterns
  const intents = {
    greeting: /^(hi|hello|hey|good morning|good afternoon|good evening|hola)/i,
    hours: /hours|open|close|when.*open|when.*close|schedule/i,
    location: /where|location|address|map|find.*you/i,
    services: /service|product|offer|what.*you.*offer|menu/i,
    contact: /contact|phone|email|call|reach/i,
    pricing: /price|cost|how much|rate|fee/i,
    appointment: /appointment|book|schedule|reserve/i,
    help: /help|assist|support/i
  };
  
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(lowerMessage)) {
      return intent;
    }
  }
  
  return 'general';
}

/**
 * Generate response based on intent
 */
async function generateResponse(intent, message, sender) {
  const profile = await profileQueries.getProfile();
  
  const responses = {
    greeting: {
      response: `Welcome to ${profile.name}! 👋 I'm your AI assistant. How can I help you today?`,
      action: 'greet',
      confidence: 1.0
    },
    hours: {
      response: await getHoursResponse(),
      action: 'provide_info',
      confidence: 0.9
    },
    location: {
      response: `📍 We're located at: ${profile.address}\n\nCome visit us!`,
      action: 'provide_info',
      confidence: 0.9
    },
    services: {
      response: `🎨 ${profile.name} offers:\n${profile.services_list}\n\nWould you like more details about any of our services?`,
      action: 'provide_info',
      confidence: 0.85
    },
    contact: {
      response: `📞 Contact us:\nPhone: ${profile.phone}\nEmail: ${profile.email}\n\nWe typically respond within ${profile.response_time}.`,
      action: 'provide_info',
      confidence: 0.9
    },
    pricing: {
      response: `💰 Pricing info:\n${profile.pricing_info}\n\nFor specific quotes, feel free to call us!`,
      action: 'provide_info',
      confidence: 0.85
    },
    appointment: {
      response: `📅 To book an appointment:\n\n1. Call us at ${profile.phone}\n2. Visit us at ${profile.address}\n3. Email us at ${profile.email}\n\nWhat time works best for you?`,
      action: 'escalate',
      confidence: 0.8,
      requiresHuman: true
    },
    help: {
      response: `I can help you with:\n\n• 📞 Contact information\n• 🕒 Business hours\n• 📍 Location\n• 🎨 Services & pricing\n• 📅 Appointments\n\nWhat would you like to know?`,
      action: 'provide_info',
      confidence: 0.9
    },
    general: {
      response: `Thanks for reaching out to ${profile.name}! 🎨\n\nI'm here to help. You can ask about our hours, location, services, pricing, or how to contact us.\n\nWhat would you like to know?`,
      action: 'provide_info',
      confidence: 0.5
    }
  };
  
  return responses[intent] || responses.general;
}

/**
 * Get formatted hours response
 */
async function getHoursResponse() {
  const hours = await hoursQueries.getHours();
  const openDays = hours.filter(h => h.is_open === 1);
  
  let response = '🕒 Business Hours:\n\n';
  
  openDays.forEach(h => {
    response += `${h.day}: ${h.open_time} - ${h.close_time}\n`;
  });
  
  return response;
}

/**
 * Main receptionist logic function
 */
async function receptionistLogic(message, sender) {
  try {
    const intent = await analyzeIntent(message);
    const result = await generateResponse(intent, message, sender);
    
    console.log(`[Fusion Galeria] Intent: ${intent}, Confidence: ${result.confidence}`);
    
    return {
      ...result,
      intent,
      sender,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Fusion Galeria] Receptionist logic error:', error);
    return {
      response: "I'm having trouble understanding. Please try again or call us directly.",
      action: 'error',
      confidence: 0,
      intent: 'error'
    };
  }
}

module.exports = { receptionistLogic };
