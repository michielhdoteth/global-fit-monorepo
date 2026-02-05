import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";
import { sendWhatsAppMessage } from "@/lib/kapso-api";

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const conversationId = Number(body.conversation_id || body.thread_id);
  if (!conversationId) {
    return NextResponse.json({ detail: "conversation_id is required" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { client: true },
  });

  if (!conversation) {
    return NextResponse.json({ detail: "Conversation not found" }, { status: 404 });
  }

  const phone = conversation.client.whatsappNumber || conversation.client.phone;
  if (!phone) {
    return NextResponse.json({ detail: "Client has no phone number" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      content: body.message,
      sender: "agent",
      senderName: currentUser.fullName,
      deliveryStatus: "PENDING",
      mediaUrl: body.media_url || null,
      mediaType: body.media_type || null,
    },
  });

  const sendResult = await sendWhatsAppMessage(phone, body.message);

  if (sendResult.success) {
    await prisma.message.update({
      where: { id: message.id },
      data: { deliveryStatus: "DELIVERED", messageId: sendResult.message_id },
    });
    console.log("[WHATSAPP_SEND] Message sent successfully:", sendResult.message_id);
  } else {
    await prisma.message.update({
      where: { id: message.id },
      data: { deliveryStatus: "FAILED" },
    });
    console.error("[WHATSAPP_SEND] Failed to send:", sendResult.error);
  }

  return NextResponse.json({ success: true, message, sendResult });
}
