// FAQ database
const faqs = {
  hours: 'Our business hours are Monday to Friday, 9 AM to 6 PM. We are closed on weekends.',
  location: 'We are located at [Address]. We have parking available on-site.',
  pricing: 'Our pricing varies by service. Please contact us for a personalized quote.',
  booking: 'You can book an appointment by sending us a message with your preferred date, time, and service.',
  cancellation: 'Please provide at least 24 hours notice for cancellations to avoid a fee.',
  payment: 'We accept cash, credit cards, and digital payments.',
  contact: 'You can reach us by phone or WhatsApp during business hours, or email us anytime.',
  services: 'We offer various services tailored to your needs. Please ask about specific services for more details.',
  consultation: 'We offer free initial consultations. Just let us know when you\'d like to schedule one.',
  emergency: 'For emergencies, please contact us directly at our main phone number. We will respond as soon as possible.'
};

export async function faqTool(args) {
  const { question } = args;

  if (!question) {
    return {
      success: false,
      error: 'Question is required'
    };
  }

  const lowerQuestion = question.toLowerCase();

  // Check for keywords in the question
  let answer = null;
  let matchedTopic = null;

  for (const [topic, response] of Object.entries(faqs)) {
    if (lowerQuestion.includes(topic)) {
      answer = response;
      matchedTopic = topic;
      break;
    }
  }

  // Additional keyword matching
  if (!answer) {
    if (lowerQuestion.includes('when are you open') || lowerQuestion.includes('what time') || lowerQuestion.includes('hours')) {
      answer = faqs.hours;
      matchedTopic = 'hours';
    } else if (lowerQuestion.includes('where are you') || lowerQuestion.includes('address') || lowerQuestion.includes('location')) {
      answer = faqs.location;
      matchedTopic = 'location';
    } else if (lowerQuestion.includes('how much') || lowerQuestion.includes('price') || lowerQuestion.includes('cost')) {
      answer = faqs.pricing;
      matchedTopic = 'pricing';
    } else if (lowerQuestion.includes('book') || lowerQuestion.includes('appoint') || lowerQuestion.includes('schedule')) {
      answer = faqs.booking;
      matchedTopic = 'booking';
    }
  }

  if (answer) {
    return {
      success: true,
      answer,
      topic: matchedTopic
    };
  }

  // No match found
  return {
    success: true,
    answer: "I don't have a specific answer to that question in my FAQ database. I'd be happy to help if you can provide more details, or I can escalate this to a human team member who can assist you further.",
    topic: 'general'
  };
}
