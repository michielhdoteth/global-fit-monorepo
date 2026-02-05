import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const conversationId = Number(body.conversation_id || body.thread_id);
  if (!conversationId) {
    return NextResponse.json({ detail: "conversation_id is required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      content: body.content || body.message,
      sender: "agent",
      senderName: body.sender_name || "Agent",
      deliveryStatus: "PENDING",
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ success: true, message });
}
