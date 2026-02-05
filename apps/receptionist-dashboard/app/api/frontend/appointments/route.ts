import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuthToken, getBearerToken } from "@/lib/token-auth";

function checkAuth(request: Request) {
  const token = getBearerToken(request.headers.get("authorization"));
  return token && verifyAuthToken(token);
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    appointments.map((apt) => ({
      id: apt.id,
      client: apt.client.name,
      clientId: apt.clientId,
      time: apt.time ? `${apt.time} hrs` : "",
      date: apt.date,
      type: apt.title,
      instructor: apt.location || "Sin asignar",
      status: apt.status === "CONFIRMED" ? "Confirmed" : "Pending",
    }))
  );
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, date, time, clientId, location, notes, duration } = body;

    if (!title || !date || !clientId) {
      return NextResponse.json({ detail: "Title, date, and clientId are required" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        title,
        date,
        time: time || null,
        clientId: Number(clientId),
        location: location || null,
        notes: notes || null,
        duration: duration ? Number(duration) : null,
        status: "PENDING",
        reminderSent: false,
      },
    });

    return NextResponse.json({ id: appointment.id, status: "Created" });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ detail: "Failed to create appointment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, date, time, clientId, location, notes, duration, status } = body;

    if (!id) {
      return NextResponse.json({ detail: "ID is required" }, { status: 400 });
    }

    const appointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        title,
        date,
        time: time || null,
        clientId: clientId ? Number(clientId) : undefined,
        location: location || null,
        notes: notes || null,
        duration: duration ? Number(duration) : null,
        status: status || undefined,
      },
    });

    return NextResponse.json({ id: appointment.id, status: "Updated" });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ detail: "Failed to update appointment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ detail: "ID is required" }, { status: 400 });
    }

    await prisma.appointment.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ status: "Deleted" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json({ detail: "Failed to delete appointment" }, { status: 500 });
  }
}
