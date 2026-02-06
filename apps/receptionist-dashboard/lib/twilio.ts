import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Only create client if credentials are properly configured
const isConfigured = accountSid && authToken
  && typeof accountSid === 'string'
  && accountSid.startsWith('AC');

if (!isConfigured) {
  console.warn('Twilio credentials not configured');
}

const client = isConfigured ? twilio(accountSid as string, authToken as string) : null;

export async function sendWhatsAppMessage(
  to: string,
  contentSid: string,
  contentVariables?: Record<string, string>
) {
  if (!client) {
    throw new Error('Twilio client not initialized - check environment variables');
  }

  // Ensure the number has whatsapp: prefix
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromNumber = whatsappNumber!.startsWith('whatsapp:')
    ? whatsappNumber
    : `whatsapp:${whatsappNumber}`;

  try {
    const message = await client.messages.create({
      contentSid,
      contentVariables: contentVariables ? JSON.stringify(contentVariables) : undefined,
      from: fromNumber,
      to: toNumber,
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error('Twilio WhatsApp error:', error);
    throw error;
  }
}

export async function sendSimpleWhatsAppMessage(
  to: string,
  body: string
) {
  if (!client) {
    throw new Error('Twilio client not initialized - check environment variables');
  }

  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromNumber = whatsappNumber!.startsWith('whatsapp:')
    ? whatsappNumber
    : `whatsapp:${whatsappNumber}`;

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: toNumber,
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error('Twilio WhatsApp error:', error);
    throw error;
  }
}
