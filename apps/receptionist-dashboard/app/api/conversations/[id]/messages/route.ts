import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const messages = await prisma.message.findMany({
    where: { conversationId: Number(id) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const message = await prisma.message.create({
    data: {
      conversationId: Number(id),
      content: body.content,
      sender: body.sender || "agent",
      senderName: body.sender_name || currentUser.fullName,
      deliveryStatus: body.delivery_status || "PENDING",
      mediaUrl: body.media_url || null,
      mediaType: body.media_type || null,
      metadata: body.metadata || null,
    },
  });

  await prisma.conversation.update({
    where: { id: Number(id) },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
