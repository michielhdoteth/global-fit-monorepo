import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const [total, active, completed, scheduled] = await Promise.all([
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.campaign.count({ where: { status: "COMPLETED" } }),
    prisma.campaign.count({ where: { status: "SCHEDULED" } }),
  ]);

  return NextResponse.json({
    total,
    active,
    completed,
    scheduled,
    total_sent: 0,
    total_delivered: 0,
    delivery_rate: 0,
  });
}
