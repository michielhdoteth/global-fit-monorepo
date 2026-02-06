import { NextResponse } from "next/server";
import prisma from "@/lib/database";

function maskSecret(value?: string | null) {
  if (!value) return "";
  const visible = value.slice(-4);
  return `${"*".repeat(Math.max(0, value.length - 4))}${visible}`;
}

export async function GET(request: Request) {
  const settings = await prisma.twilioSettings.findFirst();
  if (!settings) {
    return NextResponse.json({ configured: false, enabled: false });
  }

  return NextResponse.json({
    configured: Boolean(settings.accountSid),
    enabled: settings.isEnabled,
    account_sid: settings.accountSid || "",
    account_sid_masked: maskSecret(settings.accountSid),
    auth_token_masked: maskSecret(settings.authToken),
    whatsapp_number: settings.whatsappNumber || "",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      account_sid,
      auth_token,
      whatsapp_number,
      is_enabled,
    } = body;

    const existing = await prisma.twilioSettings.findFirst();

    const data: any = {
      whatsappNumber: whatsapp_number || null,
      isEnabled: is_enabled ?? true,
    };

    if (account_sid) data.accountSid = account_sid;
    if (auth_token) data.authToken = auth_token;

    if (existing) {
      const updated = await prisma.twilioSettings.update({
        where: { id: existing.id },
        data,
      });
      return NextResponse.json({
        success: true,
        message: "Twilio settings updated successfully",
        configured: true,
        enabled: updated.isEnabled,
      });
    } else {
      const created = await prisma.twilioSettings.create({
        data: {
          ...data,
          accountSid: account_sid || "",
          authToken: auth_token || "",
        },
      });
      return NextResponse.json({
        success: true,
        message: "Twilio settings created successfully",
        configured: true,
        enabled: created.isEnabled,
      });
    }
  } catch (error) {
    console.error("[TWILIO_SETTINGS] Error:", error);
    return NextResponse.json(
      { detail: "Failed to save Twilio settings" },
      { status: 500 }
    );
  }
}
