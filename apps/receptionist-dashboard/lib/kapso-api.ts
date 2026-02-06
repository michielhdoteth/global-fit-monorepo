/**
 * Kapso API Client - Simplified
 * Handles WhatsApp message sending through Kapso Platform API
 * Docs: https://docs.kapso.io/
 * 
 * Also supports Twilio as fallback
 */

import { sendSimpleWhatsAppMessage } from "./twilio";

interface KapsoMessagePayload {
  to: string;
  body: string;
  media_url?: string;
  media_type?: string;
}

interface KapsoSendResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}

class KapsoClient {
  private apiKey: string;
  private baseUrl: string = "https://api.kapso.io/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn("[KAPSO_CLIENT] No API key configured. Messages will not be sent.");
    }
  }

  private async sendRequest(payload: KapsoMessagePayload): Promise<KapsoSendResponse> {
    if (!this.apiKey) {
      return { success: false, error: "Kapso API key not configured" };
    }

    try {
      console.log("[KAPSO_CLIENT] Sending message to", payload.to);

      const response = await fetch(`${this.baseUrl}/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[KAPSO_CLIENT] API error:", errorData);
        return { success: false, error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      console.log("[KAPSO_CLIENT] Message sent successfully:", data.message_id);
      return { success: true, message_id: data.message_id };
    } catch (error) {
      console.error("[KAPSO_CLIENT] Error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async sendMessage(phone: string, message: string): Promise<KapsoSendResponse> {
    return this.sendRequest({ to: this.normalizePhone(phone), body: message });
  }

  async sendMessageWithMedia(
    phone: string,
    message: string,
    mediaUrl: string,
    mediaType: string = "image"
  ): Promise<KapsoSendResponse> {
    return this.sendRequest({
      to: this.normalizePhone(phone),
      body: message,
      media_url: mediaUrl,
      media_type: mediaType,
    });
  }

  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/[\s\-\(\)\.]/g, "");
    if (!normalized.startsWith("+")) {
      if (!normalized.startsWith("52")) normalized = "52" + normalized;
      normalized = "+" + normalized;
    }
    return normalized;
  }
}

let kapsoInstance: KapsoClient | null = null;

export function getKapsoClient(): KapsoClient {
  if (!kapsoInstance) kapsoInstance = new KapsoClient(process.env.KAPSO_API_KEY || "");
  return kapsoInstance;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<KapsoSendResponse> {
  // Check WHATSAPP_PROVIDER env var to determine which provider to use
  const provider = process.env.WHATSAPP_PROVIDER?.toLowerCase() || 'twilio';
  
  if (provider === 'kapso' && process.env.KAPSO_API_KEY) {
    console.log("[WHATSAPP] Using Kapso provider");
    return getKapsoClient().sendMessage(phone, message);
  }
  
  // Default to Twilio
  console.log("[WHATSAPP] Using Twilio provider");
  try {
    const result = await sendSimpleWhatsAppMessage(phone, message);
    return {
      success: true,
      message_id: result.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendWhatsAppMessageWithMedia(
  phone: string,
  message: string,
  mediaUrl: string,
  mediaType: string = "image"
): Promise<KapsoSendResponse> {
  // Check WHATSAPP_PROVIDER env var to determine which provider to use
  const provider = process.env.WHATSAPP_PROVIDER?.toLowerCase() || 'twilio';
  
  if (provider === 'kapso' && process.env.KAPSO_API_KEY) {
    return getKapsoClient().sendMessageWithMedia(phone, message, mediaUrl, mediaType);
  }
  
  // Default to Twilio (Twilio doesn't support sendSimpleWhatsAppMessage with media)
  // For now, just send the text message
  return sendWhatsAppMessage(phone, message);
}
