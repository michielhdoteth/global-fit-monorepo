import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const reminders = await prisma.reminder.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });
  return NextResponse.json(reminders);
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientName = body.client_name ? String(body.client_name).trim() : "";
  const phoneNumber = body.phone_number ? String(body.phone_number).trim() : null;

  let clientId: number | null = null;
  if (phoneNumber) {
    const existing = await prisma.client.findFirst({ where: { phone: phoneNumber } });
    if (existing) clientId = existing.id;
  }
  if (!clientId && clientName) {
    const existing = await prisma.client.findFirst({ where: { name: clientName } });
    if (existing) clientId = existing.id;
  }
  if (!clientId) {
    return NextResponse.json({ detail: "Client not found" }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      name: body.name || "",
      celphone: body.celphone || phoneNumber || "",
      message: body.message_preview || body.message || "",
      sendDate: body.scheduled_time ? new Date(body.scheduled_time) : new Date(),
      endDate: body.end_date ? new Date(body.end_date) : null,
      clientId,
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}
