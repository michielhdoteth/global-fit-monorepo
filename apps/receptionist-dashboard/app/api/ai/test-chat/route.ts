import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AgentEngine } from "@/lib/ai-agents";
import { buildChatbotSettings, validateAIConfiguration } from "@/lib/build-chatbot-settings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json(
        { detail: "Message is required" },
        { status: 400 }
      );
    }

    // Get chatbot settings from database
    const settings = await prisma.chatbotSettings.findFirst();
    const llmSettings = await prisma.llmSettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        {
          message: "Chatbot settings not configured.",
          configured: false,
          aiEnabled: false,
        },
        { status: 200 }
      );
    }

    if (!llmSettings?.apiKey) {
      return NextResponse.json(
        {
          message: "Chatbot is currently disabled.",
          configured: false,
          aiEnabled: false,
        },
        { status: 200 }
      );
    }

    // Build complete settings with dynamic API key routing
    const chatbotSettings = buildChatbotSettings(settings, llmSettings);

    // Validate AI configuration
    const aiValidation = validateAIConfiguration(chatbotSettings);
    if (!aiValidation.valid) {
      console.error("[TEST_CHAT] Validation failed:", aiValidation.error);
      return NextResponse.json(
        {
          message: aiValidation.error || "AI not properly configured",
          configured: false,
          aiEnabled: false,
        },
        { status: 200 }
      );
    }

    console.log("[TEST_CHAT] Using provider:", chatbotSettings.ai.provider, "Model:", chatbotSettings.ai.model, "API Key configured:", !!chatbotSettings.ai.apiKey);

    // Create AgentEngine instance
    const agent = new AgentEngine(chatbotSettings);

    // Create temporary session for testing
    // Note: isNewSession is false because we want to test the AI directly, not get the greeting
    const sessionData = {
      sessionId: `test-${Date.now()}`,
      isNewSession: false,
      conversationHistory: [],
      flowData: {},
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    // Process message with real AI
    console.log("[TEST_CHAT] Processing message:", message);
    const response = await agent.processMessage(message, sessionData);
    console.log("[TEST_CHAT] Response received:", response);

    return NextResponse.json({
      message: response.message,
      configured: true,
      aiEnabled: true,
      success: response.success,
      provider: chatbotSettings.ai.provider,
      model: chatbotSettings.ai.model,
    });
  } catch (error) {
    console.error("[TEST_CHAT] Error:", error);
    return NextResponse.json(
      {
        message: "Error processing message. Check server logs.",
        configured: false,
        aiEnabled: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
