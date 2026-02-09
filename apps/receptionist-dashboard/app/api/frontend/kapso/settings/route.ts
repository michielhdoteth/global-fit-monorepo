import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    let settings = await prisma.kapsoSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.kapsoSettings.create({
        data: {
          isEnabled: false,
          isConnected: false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[KAPSO_SETTINGS] Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch Kapso settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    let settings = await prisma.kapsoSettings.findFirst();
    
    if (settings) {
      settings = await prisma.kapsoSettings.update({
        where: { id: settings.id },
        data: {
          whatsappNumber: body.whatsappNumber,
          isEnabled: body.isEnabled,
          apiKey: body.apiKey,
          webhookSecret: body.webhookSecret,
          baseUrl: body.baseUrl,
        },
      });
    } else {
      settings = await prisma.kapsoSettings.create({
        data: {
          whatsappNumber: body.whatsappNumber,
          isEnabled: body.isEnabled ?? false,
          apiKey: body.apiKey,
          webhookSecret: body.webhookSecret,
          baseUrl: body.baseUrl ?? "https://api.kapso.io/v1",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[KAPSO_SETTINGS] Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update Kapso settings" }, { status: 500 });
  }
}
