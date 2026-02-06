import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { auth } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/kapso-api";
import { sendEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function sendReminder(reminder: any) {
  const { message, channel, client } = reminder;

  if (channel === "whatsapp" && client.whatsappNumber) {
    const result = await sendWhatsAppMessage(client.whatsappNumber, message);
    return result;
  }

  if (channel === "email" && client.email) {
    const result = await sendEmail({
      to: client.email,
      subject: "Recordatorio - Global Fit",
      html: message,
      text: message,
    });
    return result;
  }

  return { success: false, error: "No valid channel or contact info" };
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const reminder = await prisma.reminder.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
    },
  });

  if (!reminder) {
    return NextResponse.json({ detail: "Reminder not found" }, { status: 404 });
  }

  if (reminder.status === "SENT") {
    return NextResponse.json({ detail: "Reminder already sent" }, { status: 400 });
  }

  try {
    const result = await sendReminder(reminder);

    if (result.success) {
      const updated = await prisma.reminder.update({
        where: { id: Number(id) },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
        include: {
          client: true,
        },
      });
      return NextResponse.json({ success: true, reminder: updated });
    } else {
      await prisma.reminder.update({
        where: { id: Number(id) },
        data: {
          retries: { increment: 1 },
          status: reminder.retries + 1 >= 3 ? "FAILED" : "PENDING",
        },
      });
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send reminder" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[REMINDERS] Error sending reminder:", id, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
