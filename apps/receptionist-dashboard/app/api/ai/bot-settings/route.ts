import { NextResponse } from "next/server";
import prisma from "@/lib/db";

async function getSettings() {
  const existing = await prisma.chatbotSettings.findFirst();
  if (existing) return existing;
  return prisma.chatbotSettings.create({
    data: {},
  });
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    system_prompt: settings.systemPrompt,
    respondMessages: settings.respondMessages,
    useKnowledgeBase: settings.useKnowledgeBase,
    instantReply: settings.instantReply,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const settings = await getSettings();
  const data: Record<string, any> = {};

  if (body.system_prompt !== undefined) data.systemPrompt = String(body.system_prompt);
  if (body.respondMessages !== undefined) data.respondMessages = Boolean(body.respondMessages);
  if (body.useKnowledgeBase !== undefined) data.useKnowledgeBase = Boolean(body.useKnowledgeBase);
  if (body.instantReply !== undefined) data.instantReply = Boolean(body.instantReply);

  const updated = await prisma.chatbotSettings.update({
    where: { id: settings.id },
    data,
  });

  return NextResponse.json({
    system_prompt: updated.systemPrompt,
    respondMessages: updated.respondMessages,
    useKnowledgeBase: updated.useKnowledgeBase,
    instantReply: updated.instantReply,
  });
}
