import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { createApiError } from "@/lib/utils";
import { verifyAuthToken, getBearerToken } from "@/lib/token-auth";

function checkAuth(request: Request) {
  const token = getBearerToken(request.headers.get("authorization"));
  return token && verifyAuthToken(token);
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const reminders = await prisma.reminder.findMany({
      include: { client: true },
      orderBy: { sendAt: "desc" },
    });

    return NextResponse.json(
      reminders.map((reminder: any) => ({
        id: reminder.id,
        client: reminder.client?.name || "Unknown",
        phone: reminder.client?.phone || reminder.client?.whatsappNumber || "",
        message: reminder.message,
        scheduled_time: reminder.sendAt?.toISOString() || "",
        status: reminder.status,
        type: reminder.type,
        created_at: reminder.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("[REMINDERS] Error fetching reminders:", error);
    return NextResponse.json(createApiError("Failed to fetch reminders", 500), { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, sendAt, type, clientId, appointmentId } = body;

    if (!message || !sendAt) {
      return NextResponse.json(createApiError("Message and sendAt are required", 400), { status: 400 });
    }

    let validClientId = clientId ? Number(clientId) : null;
    if (!validClientId) {
      const defaultClient = await prisma.client.findFirst();
      if (defaultClient) {
        validClientId = defaultClient.id;
      } else {
        return NextResponse.json(createApiError("No client found", 400), { status: 400 });
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        message,
        sendAt: new Date(sendAt),
        type: type || "GENERAL",
        clientId: validClientId,
        appointmentId: appointmentId || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: reminder.id, status: "Created" });
  } catch (error) {
    console.error("[REMINDERS] Error creating reminder:", error);
    return NextResponse.json(createApiError(error instanceof Error ? error.message : "Failed to create reminder", 500), { status: 500 });
  }
}
