import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { sendWhatsAppMessage } from "@/lib/kapso-api";
import { sendEmail } from "@/lib/email";

function verifyCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

async function sendReminder(reminder: any) {
  const { message, channel, client } = reminder;

  if (channel === "whatsapp" && client.whatsappNumber) {
    const result = await sendWhatsAppMessage(client.whatsappNumber, message);
    return result.success;
  }

  if (channel === "email" && client.email) {
    const result = await sendEmail({
      to: client.email,
      subject: "Recordatorio - Global Fit",
      html: message,
      text: message,
    });
    return result.success;
  }

  return false;
}

export async function POST(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      sendAt: { lte: now },
      retries: { lt: 3 },
    },
    include: {
      client: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    try {
      const success = await sendReminder(reminder);

      if (success) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });
        sent++;
      } else {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            retries: { increment: 1 },
            status: reminder.retries + 1 >= 3 ? "FAILED" : "PENDING",
          },
        });
        failed++;
      }
    } catch (error) {
      console.error("[CRON] Error sending reminder:", reminder.id, error);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          retries: { increment: 1 },
          status: reminder.retries + 1 >= 3 ? "FAILED" : "PENDING",
        },
      });
      failed++;
    }
  }

  return NextResponse.json({
    processed: reminders.length,
    sent,
    failed,
  });
}
