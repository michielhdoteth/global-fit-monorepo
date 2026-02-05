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

  const settings = await prisma.evoSettings.findFirst();
  if (!settings) {
    return NextResponse.json({ configured: false, enabled: false });
  }

  return NextResponse.json({
    configured: Boolean(settings.apiKey),
    enabled: settings.isEnabled,
    dns: settings.dns || "",
    api_key_masked: maskSecret(settings.apiKey),
    ai_api_key_masked: maskSecret(settings.aiApiKey),
    branch_id: settings.branchId || "",
  });
}
