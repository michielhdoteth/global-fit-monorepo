import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    include: { client: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const conversation = await prisma.conversation.create({
    data: {
      clientId: Number(body.client_id),
      status: body.status || "ACTIVE",
      channel: body.channel || "whatsapp",
      assignedTo: body.assigned_to || null,
      notes: body.notes || null,
      lastMessageAt: new Date(),
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}
