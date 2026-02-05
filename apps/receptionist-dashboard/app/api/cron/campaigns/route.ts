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
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "SCHEDULED",
      startDate: { lte: now },
    },
  });

  if (campaigns.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  await prisma.campaign.updateMany({
    where: { id: { in: campaigns.map((c: typeof campaigns[0]) => c.id) } },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ processed: campaigns.length });
}
