import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { sendWhatsAppMessage } from "@/lib/kapso-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conversationId = Number(body.conversation_id || body.thread_id);

    if (!conversationId) {
      return NextResponse.json({ detail: "conversation_id is required" }, { status: 400 });
    }

    const content = body.content || body.message;
    if (!content) {
      return NextResponse.json({ detail: "content is required" }, { status: 400 });
    }

    // Get conversation with client info
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { client: true },
    });

    if (!conversation) {
      return NextResponse.json({ detail: "Conversation not found" }, { status: 404 });
    }

    // Send via WhatsApp (Kapso)
    const phoneNumber = conversation.client.whatsappNumber || conversation.client.phone;
    if (!phoneNumber) {
      return NextResponse.json(
        { detail: "Client has no phone number" },
        { status: 400 }
      );
    }

    const sendResult = await sendWhatsAppMessage(phoneNumber, content);

    // Create message record in database
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        sender: "agent",
        senderName: body.sender_name || "Agent",
        deliveryStatus: sendResult.success ? "DELIVERED" : "FAILED",
        messageId: sendResult.message_id,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message,
      sent: sendResult.success,
      kapso_message_id: sendResult.message_id,
    });
  } catch (error) {
    console.error("[CHATS_SEND] Error:", error);
    return NextResponse.json(
      { detail: "Failed to send message" },
      { status: 500 }
    );
  }
}
