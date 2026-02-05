import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

function maskSecret(value?: string | null) {
  if (!value) return "";
  const visible = value.slice(-4);
  return `${"*".repeat(Math.max(0, value.length - 4))}${visible}`;
}

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.llmSettings.findFirst();
  if (!settings) {
    return NextResponse.json({ configured: false, enabled: false });
  }

  const configured = Boolean(settings.apiKey);

  return NextResponse.json({
    configured,
    enabled: configured,
    provider: settings.provider,
    api_key_masked: maskSecret(settings.apiKey),
    model: settings.model,
    base_url: settings.baseUrl,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  });
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const hasApiKey = Boolean(body.api_key);
  const resolvedIsEnabled = hasApiKey ? true : undefined;
  const data = {
    provider: body.provider || "deepseek",
    apiKey: body.api_key || undefined,
    model: body.model || "gpt-5.2-nano",
    baseUrl: body.base_url || undefined,
    temperature: body.temperature !== undefined ? Number(body.temperature) : undefined,
    maxTokens: body.max_tokens !== undefined ? Number(body.max_tokens) : undefined,
    isEnabled: resolvedIsEnabled,
  };

  const existing = await prisma.llmSettings.findFirst();
  const settings = existing
    ? await prisma.llmSettings.update({ where: { id: existing.id }, data })
    : await prisma.llmSettings.create({ data: { ...data, isEnabled: Boolean(data.isEnabled) } });

  if (hasApiKey) {
    const chatbotData: Record<string, any> = {};
    chatbotData.aiEnabled = true;
    chatbotData.isEnabled = true;

    const chatbotSettings = await prisma.chatbotSettings.findFirst();
    if (chatbotSettings) {
      await prisma.chatbotSettings.update({
        where: { id: chatbotSettings.id },
        data: chatbotData,
      });
    } else {
      await prisma.chatbotSettings.create({ data: chatbotData });
    }
  }

  return NextResponse.json({
    success: true,
    configured: Boolean(settings.apiKey),
    enabled: settings.isEnabled,
    provider: settings.provider,
    model: settings.model,
    base_url: settings.baseUrl,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  });
}
