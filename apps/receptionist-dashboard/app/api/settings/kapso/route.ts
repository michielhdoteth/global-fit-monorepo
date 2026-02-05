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

  const settings = await prisma.kapsoSettings.findFirst();

  if (!settings) {
    return NextResponse.json({ configured: false, enabled: false });
  }

  return NextResponse.json({
    configured: Boolean(settings.apiKey),
    enabled: settings.isEnabled,
    whatsapp_number: settings.whatsappNumber || "",
    base_url: settings.baseUrl || "https://api.kapso.ai",
    api_key_masked: maskSecret(settings.apiKey),
    webhook_secret_masked: maskSecret(settings.webhookSecret),
  });
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = {
    apiKey: body.api_key || undefined,
    webhookSecret: body.webhook_secret || undefined,
    whatsappNumber: body.whatsapp_number || undefined,
    baseUrl: body.base_url || undefined,
    isEnabled: body.is_enabled !== undefined ? Boolean(body.is_enabled) : undefined,
  };

  const existing = await prisma.kapsoSettings.findFirst();
  const settings = existing
    ? await prisma.kapsoSettings.update({ where: { id: existing.id }, data })
    : await prisma.kapsoSettings.create({ data: { ...data, isEnabled: Boolean(data.isEnabled) } });

  return NextResponse.json({
    success: true,
    configured: Boolean(settings.apiKey),
    enabled: settings.isEnabled,
    whatsapp_number: settings.whatsappNumber || "",
    base_url: settings.baseUrl || "https://api.kapso.ai",
  });
}
