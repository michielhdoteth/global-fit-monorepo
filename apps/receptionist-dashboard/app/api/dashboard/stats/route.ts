import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse } from "@/lib/utils";
import { formatDateAsString } from "@/lib/utils";
import { createEvoClient } from "@/lib/evo-api";

async function safeDbCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("DB call failed:", error);
    return fallback;
  }
}

async function getEvoMemberStats() {
  const dns = process.env.EVO_DNS;
  const apiKey = process.env.EVO_TOKEN;
  const username = process.env.EVO_USERNAME;

  if (!dns || !apiKey) {
    return { totalSocios: 0, membresiasActivas: 0, evoConnected: false };
  }

  try {
    const evoClient = createEvoClient({ dns, apiKey, username });
    const connectionTest = await evoClient.testConnection();
    
    if (!connectionTest.success) {
      return { totalSocios: 0, membresiasActivas: 0, evoConnected: false };
    }

    const members = await evoClient.getActiveMembers();
    
    if (!members || members.length === 0) {
      return { totalSocios: 0, membresiasActivas: 0, evoConnected: true };
    }

    const totalSocios = members.length;
    const membresiasActivas = members.filter(
      (m) => m.membershipStatus?.toLowerCase() === "active" || m.status?.toLowerCase() === "active"
    ).length;

    return { totalSocios, membresiasActivas, evoConnected: true };
  } catch (error) {
    console.error("[EVO_STATS] Error fetching EVO stats:", error);
    return { totalSocios: 0, membresiasActivas: 0, evoConnected: false };
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = formatDateAsString(new Date());
    const now = new Date();

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
      evoStatsResult,
    ] = await Promise.all([
      safeDbCall(() => prisma.client.count(), 0),
      safeDbCall(() => prisma.client.count({ where: { NOT: { status: "INACTIVE" } } }), 0),
      safeDbCall(() => prisma.client.count({ where: { createdAt: { gte: thisMonthStart } } }), 0),
      safeDbCall(() => prisma.client.count({
        where: {
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }), 0),
      safeDbCall(() => prisma.client.count({ where: { NOT: { status: "INACTIVE" }, createdAt: { gte: thisMonthStart } } }), 0),
      safeDbCall(() => prisma.client.count({ where: { NOT: { status: "INACTIVE" }, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }), 0),
      safeDbCall(() => prisma.appointment.count({ where: { status: "PENDING" } }), 0),
      safeDbCall(() => prisma.appointment.count({ where: { date: today } }), 0),
      safeDbCall(() => prisma.conversation.count({ where: { status: "ACTIVE" } }), 0),
      safeDbCall(() => prisma.reminder.count({ where: { status: "PENDING" } }), 0),
      safeDbCall(() => prisma.campaign.count({ where: { status: "ACTIVE" } }), 0),
      safeDbCall(() => prisma.checkIn.count({
        where: {
          createdAt: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }), 0),
      safeDbCall(() => prisma.messageMetrics.findFirst({ where: { date: today } }), null),
      getEvoMemberStats(),
    ]);

    const evoStats = evoStatsResult || { totalSocios: 0, membresiasActivas: 0, evoConnected: false };
    const metrics = todayMetrics as { totalSent?: number; delivered?: number } | null;

    const totalClientsTrend =
      clientsLastMonth > 0
        ? Math.round(((clientsThisMonth / clientsLastMonth) * 100 - 100) * 10) / 10
        : 0;
    const activeClientsTrend =
      activeClientsLastMonth > 0
        ? Math.round(((activeClientsThisMonth / activeClientsLastMonth) * 100 - 100) * 10) / 10
        : 0;
    const deliveryRate =
      metrics && (metrics.totalSent || 0) > 0
        ? Math.round(((metrics.delivered || 0) / (metrics.totalSent || 1)) * 100 * 10) / 10
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
        messagesTotal: metrics?.totalSent || 0,
        deliveryRate,
        checkInsToday,
        botStatus: {
          connected: true,
          botName: "Kapso Bot",
          lastHeartbeat: new Date().toISOString(),
        },
        evoStats: {
          totalSocios: evoStats.totalSocios,
          membresiasActivas: evoStats.membresiasActivas,
          evoConnected: evoStats.evoConnected,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(errorResponse("Failed to fetch stats"), { status: 500 });
  }
}
