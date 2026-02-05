import { NextResponse } from "next/server";
import prisma from "@/lib/db";

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
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { date: todayStr } }),
    prisma.conversation.count({ where: { status: "ACTIVE" } }),
    prisma.reminder.count({ where: { status: "PENDING" } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.message.count(),
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
