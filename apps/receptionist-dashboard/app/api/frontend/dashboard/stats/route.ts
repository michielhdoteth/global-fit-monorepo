import { NextResponse } from "next/server";
import prisma from "@/lib/db";

async function safeDbCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("DB call failed:", error);
    return fallback;
  }
}

export async function GET() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const [
    totalClients,
    activeClients,
    pendingAppointments,
    todayAppointments,
    activeChats,
    pendingReminders,
    activeCampaigns,
    totalMessages,
  ] = await Promise.all([
    safeDbCall(() => prisma.client.count(), 0),
    safeDbCall(() => prisma.client.count({ where: { NOT: { status: "INACTIVE" } } }), 0),
    safeDbCall(() => prisma.appointment.count({ where: { status: "PENDING" } }), 0),
    safeDbCall(() => prisma.appointment.count({ where: { date: todayStr } }), 0),
    safeDbCall(() => prisma.conversation.count({ where: { status: "ACTIVE" } }), 0),
    safeDbCall(() => prisma.reminder.count({ where: { status: "PENDING" } }), 0),
    safeDbCall(() => prisma.campaign.count({ where: { status: "ACTIVE" } }), 0),
    safeDbCall(() => prisma.message.count(), 0),
  ]);

  return NextResponse.json({
    totalClients,
    activeClients,
    pendingAppointments,
    todayAppointments,
    activeChats,
    pendingReminders,
    activeCampaigns,
    messagesTotal: totalMessages,
    deliveryRate: 0,
    checkInsToday: 0,
    botStatus: {
      connected: false,
      botName: "Kapso Bot",
      lastHeartbeat: null,
    },
  });
}
