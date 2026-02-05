import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const threadId = Number(url.searchParams.get("thread_id"));

  const conversation = threadId
    ? await prisma.conversation.findUnique({ where: { id: threadId } })
    : await prisma.conversation.findFirst({ orderBy: { updatedAt: "desc" } });

  if (!conversation) {
    return NextResponse.json([]);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    messages.map((message: typeof messages[0]) => ({
      id: message.id,
      sender: message.sender === "agent" ? "me" : "client",
      text: message.content,
      time: message.createdAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }))
  );
}
