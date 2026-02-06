import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { successResponse, errorResponse } from "@/lib/utils";
import { AgentEngine } from "@/lib/ai-agents";
import { buildChatbotSettings } from "@/lib/build-chatbot-settings";
import { sendWhatsAppMessage } from "@/lib/kapso-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(successResponse({ processed: true }));
    }

    const message = messages[0];
    const { from, text, id: messageId, timestamp } = message;
    const messageText = text?.body || "";

    if (!messageText.trim()) {
      return NextResponse.json(successResponse({ processed: true }));
    }

    console.log("[WHATSAPP_WEBHOOK] Received message from", from, ":", messageText);

    // Find or create conversation by phone
    const clientByPhone = await prisma.client.findFirst({
      where: { whatsappNumber: from },
    });

    let conversation = clientByPhone
      ? await prisma.conversation.findFirst({
          where: { clientId: clientByPhone.id },
        })
      : null;

      // Create conversation if not exists
    if (!conversation) {
      let client = clientByPhone;
      if (!client) {
        client = await prisma.client.create({
          data: {
            name: `Contact ${from}`,
            email: `whatsapp_${from}@temp.local`,
            phone: from,
            whatsappNumber: from,
            status: "PENDING",
          },
        });
      }

      conversation = await prisma.conversation.create({
        data: {
          clientId: client.id,
          channel: "whatsapp",
          status: "ACTIVE",
        },
      });

      console.log("[WHATSAPP_WEBHOOK] Created new conversation for", from);
    }

    // Store incoming message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: messageText,
        sender: "client",
        messageId,
      },
    });

    console.log("[WHATSAPP_WEBHOOK] Stored incoming message");

    // Get chatbot settings
    const settings = await prisma.chatbotSettings.findFirst();
    const llmSettings = await prisma.llmSettings.findFirst();

    if (!settings) {
      console.warn("[WHATSAPP_WEBHOOK] No chatbot settings found");
      return NextResponse.json(successResponse({ processed: true }));
    }

    // Check if AI is enabled
    if (!llmSettings?.apiKey) {
      console.log("[WHATSAPP_WEBHOOK] AI disabled, not generating response");
      return NextResponse.json(successResponse({ processed: true }));
    }

    // Build complete settings with dynamic API key routing
    const chatbotSettings = buildChatbotSettings(settings, llmSettings);

    // Validate AI configuration
    if (!chatbotSettings.ai.apiKey) {
      console.warn("[WHATSAPP_WEBHOOK] AI not properly configured");
      return NextResponse.json(successResponse({ processed: true }));
    }

    // Initialize agent engine
    const agent = new AgentEngine(chatbotSettings);
    await agent.initialize(); // Load keyword rules from database

    // Load conversation history
    const conversationHistory = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20, // Last 20 messages for context window
    });

    // Create session data with full conversation history
    const sessionData = {
      sessionId: conversation.id.toString(),
      clientId: conversation.clientId.toString(),
      contactPhone: from,
      isNewSession: conversationHistory.length === 1, // Just the incoming message
      conversationHistory: conversationHistory.map((msg: typeof conversationHistory[0]) => ({
        role: msg.sender === "client" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
        timestamp: msg.createdAt,
      })),
      flowData: {},
      createdAt: conversation.createdAt,
      lastActivityAt: new Date(),
    };

    // Generate AI response
    console.log("[WHATSAPP_WEBHOOK] Generating AI response with", chatbotSettings.ai.provider);
    const response = await agent.processMessage(messageText, sessionData);

    if (!response.success || !response.message) {
      console.warn("[WHATSAPP_WEBHOOK] AI did not generate a response");
      return NextResponse.json(successResponse({ processed: true }));
    }

    // Store AI response in database
    const aiMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: response.message,
        sender: "agent",
        deliveryStatus: "PENDING",
      },
    });

    console.log("[WHATSAPP_WEBHOOK] Stored AI response:", response.message.substring(0, 50) + "...");

    // Send AI response via WhatsApp
    console.log("[WHATSAPP_WEBHOOK] Sending message to", from);
    const sendResult = await sendWhatsAppMessage(from, response.message);

    if (sendResult.success) {
      // Update message delivery status
      await prisma.message.update({
        where: { id: aiMessage.id },
        data: { deliveryStatus: "DELIVERED", messageId: sendResult.message_id },
      });

      console.log("[WHATSAPP_WEBHOOK] Message sent successfully:", sendResult.message_id);
    } else {
      console.error("[WHATSAPP_WEBHOOK] Failed to send message:", sendResult.error);
      // Update message delivery status to failed
      await prisma.message.update({
        where: { id: aiMessage.id },
        data: { deliveryStatus: "FAILED" },
      });
    }

    return NextResponse.json(successResponse({ processed: true, aiGenerated: true }));
  } catch (error) {
    console.error("[WHATSAPP_WEBHOOK] Error processing webhook:", error);
    return NextResponse.json(successResponse({ processed: true }), { status: 200 }); // Return 200 to acknowledge receipt
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  // Check Kapso webhook token first
  if (token === process.env.KAPSO_WEBHOOK_TOKEN) {
    console.log("[WHATSAPP_WEBHOOK] Kapso verification successful");
    return NextResponse.json(
      JSON.parse(challenge as string),
      { status: 200 }
    );
  }

  // Check Twilio webhook token
  if (token === process.env.TWILIO_VERIFY_TOKEN) {
    console.log("[WHATSAPP_WEBHOOK] Twilio verification successful");
    return NextResponse.json(challenge, { status: 200 });
  }

  console.warn("[WHATSAPP_WEBHOOK] Invalid webhook token:", token);
  return NextResponse.json({ error: "Invalid token" }, { status: 403 });
}
