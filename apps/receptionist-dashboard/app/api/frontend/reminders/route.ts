import { NextResponse } from "next/server";
import prisma from "@/lib/db";
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
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status_filter");

    const reminders = await prisma.reminder.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      reminders.map((reminder: any) => ({
        id: reminder.id,
        client: reminder.client?.name || reminder.name || "",
        phone: reminder.client?.phone || reminder.celphone || "",
        name: reminder.name,
        celphone: reminder.celphone,
        message: reminder.message,
        scheduled_time: reminder.sendDate?.toISOString() || "",
        end_date: reminder.endDate?.toISOString() || null,
        status: "Pending",
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
    const { name, celphone, message, sendDate, endDate, clientId } = body;

    if (!name || !celphone || !message || !sendDate) {
      return NextResponse.json(createApiError("Name, celphone, message and sendDate are required", 400), { status: 400 });
    }

    let validClientId = clientId ? Number(clientId) : null;
    if (!validClientId) {
      const defaultClient = await prisma.client.findFirst();
      if (defaultClient) {
        validClientId = defaultClient.id;
      } else {
        return NextResponse.json(createApiError("No client found and no default client available", 400), { status: 400 });
      }
    } else {
      const clientExists = await prisma.client.findUnique({ where: { id: validClientId } });
      if (!clientExists) {
        return NextResponse.json(createApiError("Client not found", 400), { status: 400 });
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        name,
        celphone,
        message,
        sendDate: new Date(sendDate),
        endDate: endDate ? new Date(endDate) : null,
        clientId: validClientId,
      },
    });

    return NextResponse.json({ id: reminder.id, status: "Created" });
  } catch (error) {
    console.error("[REMINDERS] Error creating reminder:", error);
    return NextResponse.json(createApiError(error instanceof Error ? error.message : "Failed to create reminder", 500), { status: 500 });
  }
}
