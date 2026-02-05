import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const [pending, sentToday, failed] = await Promise.all([
    prisma.reminder.count({ where: { status: "PENDING" } }),
    prisma.reminder.count({ where: { sentAt: { gte: start, lte: end } } }),
    prisma.reminder.count({ where: { status: "FAILED" } }),
  ]);

  return NextResponse.json({
    pending,
    sent_today: sentToday,
    read: 0,
    failed,
  });
}
