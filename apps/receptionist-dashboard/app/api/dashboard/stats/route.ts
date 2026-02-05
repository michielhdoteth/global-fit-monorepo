import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse } from "@repo/utils";
import { formatDateAsString } from "@repo/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = formatDateAsString(new Date());
    const now = new Date();

    // Calculate month-over-month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalClients,
      activeClients,
      clientsThisMonth,
      clientsLastMonth,
      activeClientsThisMonth,
      activeClientsLastMonth,
      pendingAppointments,
      todayAppointments,
      activeChats,
      pendingReminders,
      activeCampaigns,
      checkInsToday,
      todayMetrics,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.client.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.client.count({
        where: {
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      prisma.client.count({ where: { status: "ACTIVE", createdAt: { gte: thisMonthStart } } }),
      prisma.client.count({ where: { status: "ACTIVE", createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { date: today } }),
      prisma.conversation.count({ where: { status: "ACTIVE" } }),
      prisma.reminder.count({ where: { status: "PENDING" } }),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.checkIn.count({
        where: {
          createdAt: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.messageMetrics.findFirst({ where: { date: today } }),
    ]);

    const totalClientsTrend =
      clientsLastMonth > 0
        ? Math.round(((clientsThisMonth / clientsLastMonth) * 100 - 100) * 10) / 10
        : 0;
    const activeClientsTrend =
      activeClientsLastMonth > 0
        ? Math.round(((activeClientsThisMonth / activeClientsLastMonth) * 100 - 100) * 10) / 10
        : 0;
    const deliveryRate =
      todayMetrics && todayMetrics.totalSent > 0
        ? Math.round(((todayMetrics.delivered || 0) / todayMetrics.totalSent) * 100 * 10) / 10
        : 0;

    return NextResponse.json(
      successResponse({
        totalClients,
        activeClients,
        totalClientsTrend,
        activeClientsTrend,
        pendingAppointments,
        todayAppointments,
        activeChats,
        pendingReminders,
        activeCampaigns,
        messagesTotal: todayMetrics?.totalSent || 0,
        deliveryRate,
        checkInsToday,
        botStatus: {
          connected: true,
          botName: "Kapso Bot",
          lastHeartbeat: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(errorResponse("Failed to fetch stats"), { status: 500 });
  }
}
