import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const settings = await prisma.llmSettings.findFirst();
  const configured = Boolean(settings?.apiKey);
  return NextResponse.json({
    status: configured ? "active" : "inactive",
    configured,
  });
}
