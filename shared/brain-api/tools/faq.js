/**
 * FAQ Tool - Shared across all tenants
 * Handles common questions based on business profile data
 */

module.exports = {
  /**
   * Match question to FAQ entries
   */
  matchQuestion(message, faqs) {
    if (!faqs || faqs.length === 0) return null;
    
    const lowerMessage = message.toLowerCase();
    const keywords = lowerMessage.split(/\s+/).filter(w => w.length > 2);
    
    let bestMatch = null;
    let highestScore = 0;
    
    for (const faq of faqs) {
      if (!faq.keywords) continue;
      
      const faqKeywords = faq.keywords.toLowerCase().split(',').map(k => k.trim());
      let score = 0;
      
      for (const keyword of faqKeywords) {
        if (lowerMessage.includes(keyword)) {
          score += 2;
        }
      }
      
      for (const word of keywords) {
        if (faqKeywords.some(k => k.includes(word) || word.includes(k))) {
          score += 1;
        }
      }
      
      if (score > highestScore && score >= 2) {
        highestScore = score;
        bestMatch = faq;
      }
    }
    
    return bestMatch;
  },
  
  /**
   * Detect intent from message
   */
  detectIntent(message) {
    const intents = {
      pricing: /(?:price|cost|how much|rate|fee|expensive|cheap)/i,
      location: /(?:where|address|location|direction|map|find you)/i,
      contact: /(?:contact|call|email|phone|reach|speak to)/i,
      hours: /(?:hour|open|close|when.*open|business hour|time)/i,
      services: /(?:service|offer|provide|do you|what do)/i,
      payment: /(?:payment|pay|credit card|cash|invoice)/i,
      cancel: /(?:cancel|reschedule|change|appointment)/i,
      emergency: /(?:emergency|urgent|asap|immediate)/i
    };
    
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        return intent;
      }
    }
    
    return 'general';
  },
  
  /**
   * Generate response based on intent
   */
  generateResponse(intent, profile) {
    const responses = {
      pricing: {
        text: profile.pricing_info || 'Please contact us for pricing details.',
        action: 'provide_pricing'
      },
      location: {
        text: `📍 ${profile.name}\n${profile.address || 'Address not specified'}\n\n${profile.directions || ''}`,
        action: 'provide_location'
      },
      contact: {
        text: `📞 ${profile.phone || 'Phone not specified'}\n📧 ${profile.email || 'Email not specified'}\n\nOr reply here and we'll get back to you!`,
        action: 'provide_contact'
      },
      hours: {
        text: this.formatHours(profile.operatingHours),
        action: 'provide_hours'
      },
      services: {
        text: profile.services_list || 'Contact us to learn about our services.',
        action: 'list_services'
      },
      payment: {
        text: profile.payment_methods || 'We accept various payment methods. Contact us for details.',
        action: 'provide_payment_info'
      },
      cancel: {
        text: `To cancel or reschedule, please:\n1. Reply with your appointment details\n2. Or call us at ${profile.phone || 'our number'}\n\nPlease provide at least 24 hours notice.`,
        action: 'handle_cancellation'
      },
      emergency: {
        text: `🚨 For emergencies, please:\n📞 Call: ${profile.emergency_phone || profile.phone || 'emergency services'}\n\nIf this is a medical emergency, please call emergency services directly.`,
        action: 'emergency_escalation'
      },
      general: {
        text: `Hello! 👋 I'm the ${profile.name} assistant.\n\nHow can I help you today?\n\n` +
              `You can ask me about:\n` +
              `• Services\n` +
              `• Pricing\n` +
              `• Hours & location\n` +
              `• Booking appointments`,
        action: 'greeting'
      }
    };
    
    return responses[intent] || responses.general;
  },
  
  /**
   * Format operating hours for display
   */
  formatHours(hours) {
    if (!hours || hours.length === 0) {
      return 'Hours not specified. Please contact us.';
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let output = '🕐 Our Hours:\n\n';
    
    for (const day of days) {
      const dayHours = hours.find(h => h.day === day);
      if (dayHours) {
        output += `${day.slice(0, 3)}: ${dayHours.is_open ? `${dayHours.open_time} - ${dayHours.close_time}` : 'Closed'}\n`;
      }
    }
    
    return output;
  },
  
  /**
   * Execute FAQ handling
   */
  async execute(message, profile, tenant) {
    // First check for FAQ matches
    const faqMatch = this.matchQuestion(message, profile.faqs);
    
    if (faqMatch) {
      return {
        text: faqMatch.answer,
        toolUsed: 'faq',
        matchedFaq: faqMatch.question
      };
    }
    
    // Fall back to intent detection
    const intent = this.detectIntent(message);
    const response = this.generateResponse(intent, profile);
    
    return {
      ...response,
      toolUsed: 'faq',
      intent
    };
  }
};
