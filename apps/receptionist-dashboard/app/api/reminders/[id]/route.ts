import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuthToken, getBearerToken } from "@/lib/token-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token || !verifyAuthToken(token)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reminder = await prisma.reminder.findUnique({
    where: { id: parseInt(id) },
    include: { client: true },
  });

  if (!reminder) {
    return NextResponse.json({ detail: "Reminder not found" }, { status: 404 });
  }

  return NextResponse.json(reminder);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token || !verifyAuthToken(token)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const reminder = await prisma.reminder.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        celphone: body.celphone,
        message: body.message,
        sendDate: body.sendDate ? new Date(body.sendDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        clientId: body.clientId ? Number(body.clientId) : undefined,
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json({ detail: "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token || !verifyAuthToken(token)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.reminder.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json({ detail: "Failed to delete reminder" }, { status: 500 });
  }
}
