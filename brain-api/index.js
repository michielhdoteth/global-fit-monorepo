import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { bookingTool } from './tools/booking.js';
import { faqTool } from './tools/faq.js';
import { escalationTool } from './tools/escalation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(express.json());

// Simple API key middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const expectedKey = process.env.API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// System prompt for receptionist
const getSystemPrompt = (businessProfile) => {
  return `You are a professional and friendly receptionist for ${businessProfile?.name || 'a business'}.

Your role:
- Be helpful, polite, and professional
- Answer questions about the business
- Assist with booking appointments
- Handle customer service inquiries
- Know when to escalate complex issues to a human

Business Information:
${businessProfile ? `
- Name: ${businessProfile.name}
- Description: ${businessProfile.description}
- Phone: ${businessProfile.phone || 'Not provided'}
- Email: ${businessProfile.email || 'Not provided'}
- Address: ${businessProfile.address || 'Not provided'}
` : 'No specific business information provided.'}

Guidelines:
- Keep responses concise but complete
- Use a friendly, welcoming tone
- If you don't know something, admit it and offer to escalate
- For bookings, collect: name, phone, date, time, and service needed
- If a customer seems upset or has a complex issue, suggest escalation
- Always be helpful and patient

You have access to tools for booking, FAQs, and escalation. Use them when appropriate.`;
};

// Format conversation history for OpenAI
const formatConversationHistory = (history) => {
  return history.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.message
  }));
};

// Tool definitions for OpenAI
const tools = [
  {
    type: 'function',
    function: {
      name: 'booking',
      description: 'Create or manage a booking/appointment',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['create', 'check', 'cancel'],
            description: 'The booking action to perform'
          },
          name: {
            type: 'string',
            description: 'Customer name'
          },
          phone: {
            type: 'string',
            description: 'Customer phone number'
          },
          date: {
            type: 'string',
            description: 'Date for the booking (e.g., "2024-02-15")'
          },
          time: {
            type: 'string',
            description: 'Time for the booking (e.g., "14:00")'
          },
          service: {
            type: 'string',
            description: 'Service requested'
          }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'faq',
      description: 'Get answers to frequently asked questions',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The FAQ question or topic'
          }
        },
        required: ['question']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'escalate',
      description: 'Escalate a conversation to a human',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Reason for escalation'
          },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Urgency level'
          },
          notes: {
            type: 'string',
            description: 'Additional notes for the human agent'
          }
        },
        required: ['reason']
      }
    }
  }
];

// Main receptionist endpoint
app.post('/api/receptionist', apiKeyAuth, async (req, res) => {
  try {
    const { phoneNumber, message, businessProfile, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: getSystemPrompt(businessProfile)
      }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...formatConversationHistory(conversationHistory));
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });

    const responseMessage = completion.choices[0].message;

    // Handle tool calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolResults = [];

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let result;
        switch (functionName) {
          case 'booking':
            result = await bookingTool(functionArgs);
            break;
          case 'faq':
            result = await faqTool(functionArgs);
            break;
          case 'escalate':
            result = await escalationTool(functionArgs);
            break;
          default:
            result = { error: 'Unknown tool' };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(result)
        });
      }

      // Get final response with tool results
      const finalCompletion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [...messages, responseMessage, ...toolResults],
        temperature: 0.7,
        max_tokens: 500
      });

      return res.json({
        reply: finalCompletion.choices[0].message.content,
        toolCalls: responseMessage.tool_calls
      });
    }

    return res.json({
      reply: responseMessage.content
    });

  } catch (error) {
    console.error('Error in receptionist endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Start server
if (process.env.NODE_ENV !== 'vercel') {
  app.listen(PORT, () => {
    console.log(`Brain API server running on port ${PORT}`);
  });
}

// Export for Vercel
export default app;
