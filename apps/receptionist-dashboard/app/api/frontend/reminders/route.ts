import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { createEvoClient } from "@/lib/evo-api";
import { createApiError } from "@/lib/utils";
import { verifyAuthToken, getBearerToken } from "@/lib/token-auth";

function checkAuth(request: Request) {
  const token = getBearerToken(request.headers.get("authorization"));
  return token && verifyAuthToken(token);
}

async function getEvoMemberInfo(memberId: number) {
  try {
    const dns = process.env.EVO_DNS;
    const token = process.env.EVO_TOKEN;
    const username = process.env.EVO_USERNAME;

    if (!dns || !token) return null;

    const evoClient = createEvoClient({
      dns,
      apiKey: token,
      username,
    });

    const member = await evoClient.getMember(memberId);
    if (!member) return null;

    const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
    const phoneContact = member.contacts?.find((c: any) => c.contactType === "Cellphone" || c.contactType === "Phone");

    return {
      name: fullName || "Sin nombre",
      phone: phoneContact?.description || "",
      email: member.contacts?.find((c: any) => c.contactType === "E-mail")?.description || "",
      photoUrl: member.photoUrl,
    };
  } catch (error) {
    console.error("[REMINDERS] Error fetching Evo member:", error);
    return null;
  }
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const reminders = await prisma.reminder.findMany({
      orderBy: { sendAt: "desc" },
    });

    const remindersWithClient = await Promise.all(
      reminders.map(async (reminder: any) => {
        let clientInfo = null;
        if (reminder.clientId) {
          clientInfo = await getEvoMemberInfo(Number(reminder.clientId));
        }

        return {
          id: reminder.id,
          client: clientInfo?.name || `Cliente ${reminder.clientId}` || "Cliente",
          phone: clientInfo?.phone || "",
          email: clientInfo?.email || "",
          photoUrl: clientInfo?.photoUrl || null,
          message: reminder.message,
          scheduled_time: reminder.sendAt?.toISOString() || "",
          status: reminder.status,
          type: reminder.type || "GENERAL",
          created_at: reminder.createdAt.toISOString(),
          clientId: reminder.clientId,
        };
      })
    );

    return NextResponse.json(remindersWithClient);
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
    const { type, message, sendDate, endDate, clientId, channel } = body;

    if (!type || !message || !sendDate) {
      return NextResponse.json(createApiError("Type, message and sendDate are required", 400), { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        type,
        message,
        sendAt: new Date(sendDate),
        endDate: endDate ? new Date(endDate) : new Date(sendDate),
        clientId: clientId ? Number(clientId) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: reminder.id, status: "Created" });
  } catch (error) {
    console.error("[REMINDERS] Error creating reminder:", error);
    return NextResponse.json(createApiError(error instanceof Error ? error.message : "Failed to create reminder", 500), { status: 500 });
  }
}
