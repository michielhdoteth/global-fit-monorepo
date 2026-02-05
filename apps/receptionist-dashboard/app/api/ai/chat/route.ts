import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse } from "@repo/utils";
import { AgentEngine } from "@repo/ai-agents";
import { buildChatbotSettings } from "@/lib/build-chatbot-settings";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string(),
  conversationId: z.string().optional(),
  clientId: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { message, conversationId, clientId } = chatSchema.parse(body);

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.conversation.findUnique({ where: { id: parseInt(conversationId) } })
      : null;

    if (!conversation && clientId) {
      conversation = await prisma.conversation.create({
        data: {
          clientId,
          channel: "whatsapp",
          status: "ACTIVE",
        },
      });
    }

    if (!conversation) {
      return NextResponse.json(errorResponse("Conversation not found"), { status: 404 });
    }

    // Get chatbot settings
    const settings = await prisma.chatbotSettings.findFirst();
    const llmSettings = await prisma.llmSettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        errorResponse("Chatbot settings not configured"),
        { status: 500 }
      );
    }

    if (!llmSettings?.apiKey) {
      return NextResponse.json(
        errorResponse("Chatbot is currently disabled"),
        { status: 400 }
      );
    }

    // Build complete settings with dynamic API key routing
    const chatbotSettings = buildChatbotSettings(settings, llmSettings);

    // Initialize agent engine
    const agent = new AgentEngine(chatbotSettings);

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
      contactPhone: "",
      isNewSession: conversationHistory.length === 0,
      conversationHistory: conversationHistory.map((msg: typeof conversationHistory[0]) => ({
        role: msg.sender === "client" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
        timestamp: msg.createdAt,
      })),
      flowData: {},
      createdAt: conversation.createdAt,
      lastActivityAt: new Date(),
    };

    // Process message
    const response = await agent.processMessage(message, sessionData);

    // Store messages
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        sender: "client",
      },
    });

    if (response.message) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: response.message,
          sender: "agent",
        },
      });
    }

    return NextResponse.json(
      successResponse({
        reply: response.message,
        conversationId: conversation.id.toString(),
      })
    );
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(errorResponse("Failed to process message"), { status: 500 });
  }
}
