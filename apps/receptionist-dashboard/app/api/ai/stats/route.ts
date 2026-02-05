import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const [activeChats, messagesToday, docsCount] = await Promise.all([
    prisma.conversation.count({ where: { status: "ACTIVE" } }),
    prisma.message.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.knowledgeDocument.count(),
  ]);

  return NextResponse.json({
    activeChats,
    messagesToday,
    automationRate: 0,
    docsCount,
  });
}
