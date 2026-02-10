import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

async function safeDbCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("DB call failed:", error);
    return fallback;
  }
}

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
    safeDbCall(() => prisma.client.count(), 0),
    safeDbCall(() => prisma.client.count({ where: { NOT: { status: "INACTIVE" } } }), 0),
    safeDbCall(() => prisma.appointment.count({ where: { date: todayStr } }), 0),
    safeDbCall(() => prisma.conversation.count({ where: { status: "ACTIVE" } }), 0),
    safeDbCall(() => prisma.reminder.count({ where: { status: "PENDING" } }), 0),
  ]);

  return NextResponse.json({
    totalClients,
    activeClients,
    todayAppointments,
    activeChats,
    pendingReminders,
  });
}
