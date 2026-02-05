import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const appointments = await prisma.appointment.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    appointments.map((apt: typeof appointments[0]) => ({
      id: apt.id,
      client: apt.client.name,
      time: apt.time ? `${apt.time} hrs` : "",
      date: apt.date,
      type: apt.title,
      instructor: apt.location || "Sin asignar",
      status: apt.status === "CONFIRMED" ? "Confirmed" : "Pending",
    }))
  );
}
