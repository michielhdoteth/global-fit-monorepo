/**
 * WhatsApp Utilities
 * Helper functions for WhatsApp formatting and messaging
 */

/**
 * Format a phone number for WhatsApp
 * @param phone - Phone number (can include +, spaces, dashes)
 * @returns Formatted phone number without special characters
 */
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Generate WhatsApp link for a phone number
 * @param phone - Phone number
 * @param message - Optional message to pre-fill
 * @returns WhatsApp URL
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const baseUrl = `https://wa.me/${formattedPhone}`;

  if (message) {
    const encodedMessage = encodeURIComponent(message);
    return `${baseUrl}?text=${encodedMessage}`;
  }

  return baseUrl;
}

/**
 * Check if a phone number is valid for WhatsApp
 * @param phone - Phone number
 * @returns true if valid
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  const formatted = formatPhoneForWhatsApp(phone);
  return formatted.length >= 10 && formatted.length <= 15;
}

/**
 * Format message for WhatsApp
 */
export function formatMessageForWhatsApp(message: string): string {
  return message.trim();
}

/**
 * Parse WhatsApp webhook event
 */
export function parseWhatsAppWebhook(body: any) {
  return {
    from: body.messages?.[0]?.from,
    message: body.messages?.[0]?.text?.body,
    messageId: body.messages?.[0]?.id,
    timestamp: body.messages?.[0]?.timestamp,
    type: body.messages?.[0]?.type,
  };
}
