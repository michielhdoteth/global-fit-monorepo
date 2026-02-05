import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getInitials, createApiError } from "@/lib/utils";

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: { client: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      conversations.map(conversation => {
        const lastMessage = conversation.messages[0];
        return {
          id: conversation.id,
          user: conversation.client.name,
          avatar: getInitials(conversation.client.name),
          lastMessage: lastMessage?.content || "",
          unread: 0,
          time: conversation.lastMessageAt
            ? conversation.lastMessageAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
            : "",
          online: false,
        };
      })
    );
  } catch (error) {
    console.error("[CHATS] Error fetching threads:", error);
    return NextResponse.json(createApiError("Failed to fetch threads", 500), { status: 500 });
  }
}
