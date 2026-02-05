import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { AgentEngine } from "@/lib/ai-agents";
import { buildChatbotSettings, validateAIConfiguration } from "@/lib/build-chatbot-settings";
import { sendWhatsAppMessage } from "@/lib/kapso-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body.message || "").trim();
    const testKapso = body.test_kapso === true;
    const testPhone = String(body.test_phone || "").trim();

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
    await agent.initialize();

    // Create temporary session for testing
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

    const result: any = {
      message: response.message,
      configured: true,
      aiEnabled: true,
      success: response.success,
      provider: chatbotSettings.ai.provider,
      model: chatbotSettings.ai.model,
    };

    // Test Kapso integration if requested
    if (testKapso && response.message && testPhone) {
      console.log("[TEST_CHAT] Testing Kapso integration to", testPhone);
      const kapsoResult = await sendWhatsAppMessage(testPhone, response.message);
      result.kapsoTest = {
        sent: kapsoResult.success,
        messageId: kapsoResult.message_id,
        error: kapsoResult.error,
      };
      console.log("[TEST_CHAT] Kapso result:", kapsoResult);
    }

    return NextResponse.json(result);
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
