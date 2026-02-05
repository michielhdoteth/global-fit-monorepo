import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { mapReminderStatus, createApiError } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status_filter");

    const reminders = await prisma.reminder.findMany({
      where: statusFilter ? { status: statusFilter.toUpperCase() as any } : {},
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      reminders.map((reminder: any) => ({
        id: reminder.id,
        client: reminder.client?.name || "",
        phone: reminder.client?.phone || "",
        type: reminder.type.toLowerCase(),
        message: reminder.message,
        scheduled_time: reminder.sendAt?.toISOString() || "",
        status: mapReminderStatus(reminder.status),
        sent_at: reminder.sentAt?.toISOString() || null,
        created_at: reminder.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("[REMINDERS] Error fetching reminders:", error);
    return NextResponse.json(createApiError("Failed to fetch reminders", 500), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id, type, message, scheduled_time } = body;

    if (!client_id || !message) {
      return NextResponse.json(createApiError("Client ID and message are required", 400), { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        clientId: Number(client_id),
        type: type?.toUpperCase() || "GENERAL",
        message,
        sendAt: scheduled_time ? new Date(scheduled_time) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: reminder.id, status: "Pending" });
  } catch (error) {
    console.error("[REMINDERS] Error creating reminder:", error);
    return NextResponse.json(createApiError("Failed to create reminder", 500), { status: 500 });
  }
}
