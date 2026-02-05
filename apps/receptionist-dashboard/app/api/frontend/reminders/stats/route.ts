import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const total = await prisma.reminder.count();

  return NextResponse.json({
    pending: total,
    sent_today: 0,
    read: 0,
    failed: 0,
  });
}
