import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const appointment = await prisma.appointment.update({
    where: { id: Number(id) },
    data: {
      title: body.title,
      description: body.description || null,
      date: body.date,
      time: body.time || null,
      duration: body.duration ? Number(body.duration) : null,
      status: body.status || undefined,
      reminderSent: body.reminder_sent !== undefined ? Boolean(body.reminder_sent) : undefined,
      reminderTime: body.reminder_time || null,
      location: body.location || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(appointment);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.appointment.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
