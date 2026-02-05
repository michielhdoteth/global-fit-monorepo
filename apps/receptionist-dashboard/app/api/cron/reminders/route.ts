import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function verifyCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

export async function POST(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: {
      sendDate: { lte: now },
    },
    include: {
      client: true,
    },
  });

  return NextResponse.json({ processed: reminders.length, sent: 0, failed: 0 });
}
