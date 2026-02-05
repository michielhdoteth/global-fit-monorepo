import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const [
    totalClients,
    activeClients,
    todayAppointments,
    activeChats,
    pendingReminders,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.appointment.count({ where: { date: todayStr } }),
    prisma.conversation.count({ where: { status: "ACTIVE" } }),
    prisma.reminder.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    totalClients,
    activeClients,
    todayAppointments,
    activeChats,
    pendingReminders,
  });
}
