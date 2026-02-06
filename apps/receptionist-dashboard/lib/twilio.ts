import twilio from 'twilio';
import { prisma } from '@/lib/database';

// Get Twilio client - reads from database settings
async function getTwilioClient() {
  const settings = await prisma.twilioSettings.findFirst({
    where: { isEnabled: true }
  });

  if (!settings || !settings.accountSid || !settings.authToken) {
    return null;
  }

  // Check if accountSid is valid format
  if (!settings.accountSid.startsWith('AC')) {
    console.warn('Twilio Account SID must start with AC');
    return null;
  }

  return {
    client: twilio(settings.accountSid, settings.authToken),
    whatsappNumber: settings.whatsappNumber
  };
}

export async function sendWhatsAppMessage(
  to: string,
  contentSid: string,
  contentVariables?: Record<string, string>
) {
  const twilioConfig = await getTwilioClient();

  if (!twilioConfig) {
    throw new Error('Twilio not configured or enabled - check settings page');
  }

  const { client, whatsappNumber } = twilioConfig;

  if (!whatsappNumber) {
    throw new Error('Twilio WhatsApp number not configured');
  }

  // Ensure the number has whatsapp: prefix
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromNumber = whatsappNumber.startsWith('whatsapp:')
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
  const twilioConfig = await getTwilioClient();

  if (!twilioConfig) {
    throw new Error('Twilio not configured or enabled - check settings page');
  }

  const { client, whatsappNumber } = twilioConfig;

  if (!whatsappNumber) {
    throw new Error('Twilio WhatsApp number not configured');
  }

  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromNumber = whatsappNumber.startsWith('whatsapp:')
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
