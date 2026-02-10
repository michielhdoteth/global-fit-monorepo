// Escalation tracking
const escalations = new Map();

export async function escalationTool(args) {
  const { reason, urgency = 'medium', notes = '' } = args;

  if (!reason) {
    return {
      success: false,
      error: 'Reason for escalation is required'
    };
  }

  const escalationId = Date.now().toString();
  const escalation = {
    id: escalationId,
    reason,
    urgency,
    notes,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  escalations.set(escalationId, escalation);

  // Generate appropriate response based on urgency
  let responseMessage = '';
  switch (urgency) {
    case 'high':
      responseMessage = 'I understand this is urgent. I\'m escalating this immediately to our team. A human agent will reach out to you very shortly. Thank you for your patience.';
      break;
    case 'medium':
      responseMessage = 'I\'ve escalated this to our team. A human agent will get back to you within business hours. Is there anything else I can help you with in the meantime?';
      break;
    case 'low':
      responseMessage = 'I\'ve noted your request and will pass it along to our team. Someone will follow up with you soon. Thank you for contacting us!';
      break;
    default:
      responseMessage = 'I\'ve escalated your request to our team. A human agent will follow up with you shortly.';
  }

  return {
    success: true,
    escalation,
    message: responseMessage
  };
}

// Helper function to get all escalations
export function getEscalations() {
  return Array.from(escalations.values());
}

// Helper function to get escalation by ID
export function getEscalationById(id) {
  return escalations.get(id);
}
