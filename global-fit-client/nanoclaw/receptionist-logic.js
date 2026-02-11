/**
 * Receptionist Logic - Global Fit
 * AI-powered business logic for handling customer inquiries
 */

const { profileQueries, hoursQueries } = require('/app/storage/db');

/**
 * Analyze message and determine intent
 */
async function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Intent detection patterns
  const intents = {
    greeting: /^(hi|hello|hey|good morning|good afternoon|good evening|hola)/i,
    hours: /hours|open|close|when.*open|when.*close|schedule|class.*schedule/i,
    location: /where|location|address|map|find.*you|gym.*location/i,
    services: /service|class|program|offer|what.*you.*offer|membership|workout/i,
    contact: /contact|phone|email|call|reach|speak.*someone/i,
    pricing: /price|cost|how much|rate|fee|membership.*price|monthly|annual/i,
    appointment: /appointment|book|schedule|reserve|sign.*up|join/i,
    trainer: /trainer|coach|personal.*trainer|pt/i,
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
      response: `Welcome to ${profile.name}! 💪 I'm your fitness assistant. How can I help you reach your goals today?`,
      action: 'greet',
      confidence: 1.0
    },
    hours: {
      response: await getHoursResponse(),
      action: 'provide_info',
      confidence: 0.9
    },
    location: {
      response: `📍 We're located at: ${profile.address}\n\nCome visit us and start your fitness journey!`,
      action: 'provide_info',
      confidence: 0.9
    },
    services: {
      response: `🏋️ ${profile.name} offers:\n${profile.services_list}\n\nReady to start? Which program interests you?`,
      action: 'provide_info',
      confidence: 0.85
    },
    contact: {
      response: `📞 Contact us:\nPhone: ${profile.phone}\nEmail: ${profile.email}\n\nWe typically respond within ${profile.response_time}.`,
      action: 'provide_info',
      confidence: 0.9
    },
    pricing: {
      response: `💰 Membership info:\n${profile.pricing_info}\n\nStop by for a free tour and consultation!`,
      action: 'provide_info',
      confidence: 0.85
    },
    appointment: {
      response: `📅 To get started:\n\n1. Visit us at ${profile.address}\n2. Call us at ${profile.phone}\n3. Email us at ${profile.email}\n\nWe'll help you find the perfect membership plan!`,
      action: 'escalate',
      confidence: 0.8,
      requiresHuman: true
    },
    trainer: {
      response: `💪 Our trainers are experts in:\n• Personal training\n• Group fitness\n• Specialized programs\n\nFor trainer availability and bookings, call us at ${profile.phone}`,
      action: 'provide_info',
      confidence: 0.85
    },
    help: {
      response: `I can help you with:\n\n• 📞 Contact information\n• 🕒 Gym hours\n• 📍 Location\n• 🏋️ Services & memberships\n• 💰 Pricing\n• 👨‍🏫 Trainer info\n\nWhat would you like to know?`,
      action: 'provide_info',
      confidence: 0.9
    },
    general: {
      response: `Thanks for choosing ${profile.name}! 💪\n\nI'm here to help with your fitness journey. Ask about our hours, location, services, memberships, pricing, or trainer information.\n\nWhat would you like to know?`,
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
  
  let response = '🕒 Gym Hours:\n\n';
  
  openDays.forEach(h => {
    response += `${h.day}: ${h.open_time} - ${h.close_time}\n`;
  });
  
  response += '\n💡 24/7 access available for premium members!';
  
  return response;
}

/**
 * Main receptionist logic function
 */
async function receptionistLogic(message, sender) {
  try {
    const intent = await analyzeIntent(message);
    const result = await generateResponse(intent, message, sender);
    
    console.log(`[Global Fit] Intent: ${intent}, Confidence: ${result.confidence}`);
    
    return {
      ...result,
      intent,
      sender,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Global Fit] Receptionist logic error:', error);
    return {
      response: "I'm having trouble understanding. Please try again or call us directly.",
      action: 'error',
      confidence: 0,
      intent: 'error'
    };
  }
}

module.exports = { receptionistLogic };
