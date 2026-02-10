/**
 * Booking Tool - Shared across all tenants
 * Handles appointment scheduling, availability checks, etc.
 */

module.exports = {
  /**
   * Check if business is currently open based on operating hours
   */
  checkOperatingHours(hours) {
    if (!hours || hours.length === 0) return true; // Default to open
    
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const todayHours = hours.find(h => h.day === dayOfWeek);
    
    if (!todayHours || !todayHours.is_open) {
      return false;
    }
    
    const [openHour, openMin] = todayHours.open_time.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close_time.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return currentTime >= openMinutes && currentTime <= closeMinutes;
  },
  
  /**
   * Extract appointment details from message
   */
  extractAppointment(message) {
    const patterns = {
      date: /(?:on|at|for)?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{2,4}|tomorrow|today|next\s+\w+|in\s+\d+\s+(?:days|hours))/i,
      time: /(?:at|:)?\s*(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))/i,
      service: /(?:for|book|schedule)\s+(?:a\s+)?(.+?)(?:\s+(?:on|at|for|$))/i,
      name: /(?:my name is|i'm|i am)\s+(\w+)/i,
      phone: /(?:phone|number|call)\s*:?\s*(\+?\d[\d\s\-\(\)]{7,})/i
    };
    
    const result = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) {
        result[key] = match[1].trim();
      }
    }
    
    return result;
  },
  
  /**
   * Generate booking confirmation response
   */
  generateConfirmation(details) {
    const { date, time, service, name } = details;
    
    return {
      text: `✅ Booking Confirmed!\n\n` +
            `📅 Date: ${date || 'TBD'}\n` +
            `⏰ Time: ${time || 'TBD'}\n` +
            `🎯 Service: ${service || 'General'}\n` +
            `👤 Name: ${name || 'Guest'}\n\n` +
            `We'll send you a reminder before your appointment.`,
      toolUsed: 'booking'
    };
  },
  
  /**
   * Check availability for a date/time
   */
  async checkAvailability(dbPath, date, time) {
    // In a real implementation, query the DB for existing appointments
    // For now, return mock availability
    const busySlots = ['09:00', '10:00', '14:00'];
    
    return {
      available: !busySlots.includes(time),
      suggestedTimes: ['09:30', '10:30', '11:00', '13:00', '15:00']
    };
  },
  
  /**
   * Execute booking flow
   */
  async execute(message, profile, tenant) {
    const isOpen = this.checkOperatingHours(profile.operatingHours);
    
    // Extract booking details from message
    const details = this.extractAppointment(message);
    
    // Check if we have enough information
    if (!details.date && !details.time) {
      return {
        text: `I'd be happy to help you book an appointment! ${isOpen ? 'We are currently open.' : 'Note: We are currently closed.'}\n\n` +
              `Please let me know:\n` +
              `1. What date would you like?\n` +
              `2. What time works for you?\n` +
              `3. What service do you need?`,
        toolUsed: 'booking',
        state: 'collecting_info'
      };
    }
    
    // Check availability
    if (details.date && details.time) {
      const availability = await this.checkAvailability(tenant.dbPath, details.date, details.time);
      
      if (!availability.available) {
        return {
          text: `I'm sorry, but ${details.time} on ${details.date} is already booked.\n\n` +
                `Available times: ${availability.suggestedTimes.join(', ')}`,
          toolUsed: 'booking',
          state: 'suggesting_alternatives'
        };
      }
      
      // Confirm booking
      return this.generateConfirmation({
        ...details,
        name: details.name || 'Guest'
      });
    }
    
    // Ask for missing information
    const missing = [];
    if (!details.date) missing.push('date');
    if (!details.time) missing.push('time');
    if (!details.service) missing.push('service');
    
    return {
      text: `Got it! I just need a ${missing.join(' and ')} to complete your booking.`,
      toolUsed: 'booking',
      state: 'collecting_info',
      collected: details
    };
  }
};
