import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = {
    dns: body.dns || undefined,
    apiKey: body.api_key || undefined,
    aiApiKey: body.ai_api_key || undefined,
    branchId: body.branch_id || undefined,
    isEnabled: body.is_enabled !== undefined ? Boolean(body.is_enabled) : undefined,
  };

  const existing = await prisma.evoSettings.findFirst();
  const settings = existing
    ? await prisma.evoSettings.update({ where: { id: existing.id }, data })
    : await prisma.evoSettings.create({ data: { ...data, isEnabled: Boolean(data.isEnabled) } });

  return NextResponse.json({
    success: true,
    configured: Boolean(settings.apiKey),
    enabled: settings.isEnabled,
  });
}
