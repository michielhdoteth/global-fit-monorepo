import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendAppointmentReminder, sendEmail } from "@/lib/email";

function verifyCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
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
    },
    include: {
      client: true,
      appointment: true,
    },
  });

  if (reminders.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    if (reminder.client?.email && reminder.type === "APPOINTMENT" && reminder.appointment) {
      const result = await sendAppointmentReminder({
        clientEmail: reminder.client.email,
        clientName: reminder.client.name,
        appointmentDate: reminder.appointment.date,
        appointmentTime: reminder.appointment.time || "Por confirmar",
      });

      if (result.success) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "SENT", sentAt: now },
        });
        sent++;
      } else {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED", retries: { increment: 1 } },
        });
        failed++;
      }
    } else if (reminder.client?.email && reminder.message) {
      const result = await sendEmail({
        to: reminder.client.email,
        subject: "Recordatorio de Global Fit",
        html: `<p>${reminder.message}</p>`,
      });

      if (result.success) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "SENT", sentAt: now },
        });
        sent++;
      } else {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED", retries: { increment: 1 } },
        });
        failed++;
      }
    } else {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: now },
      });
      sent++;
    }
  }

  console.log(`[CRON_REMINDERS] Processed: ${reminders.length}, Sent: ${sent}, Failed: ${failed}`);
  return NextResponse.json({ processed: reminders.length, sent, failed });
}
