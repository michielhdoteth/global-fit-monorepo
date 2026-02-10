import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuthToken, getBearerToken } from "@/lib/token-auth";
import { createEvoClient } from "@/lib/evo-api";

function getInitials(firstName?: string, lastName?: string): string {
  const initials = [];
  if (firstName && firstName.length > 0) {
    initials.push(firstName[0]);
  }
  if (lastName && lastName.length > 0) {
    initials.push(lastName[0]);
  }
  return initials.join("").toUpperCase();
}

function extractEmail(contacts?: any[]): string {
  if (!contacts || !Array.isArray(contacts)) return "";
  const emailContact = contacts.find(c => c.contactType === "E-mail");
  return emailContact?.description || "";
}

function extractPhone(contacts?: any[]): string {
  if (!contacts || !Array.isArray(contacts)) return "";
  const phoneContact = contacts.find(c => c.contactType === "Cellphone" || c.contactType === "Phone");
  return phoneContact?.description || "";
}

async function getEvoMemberInfo(memberId: number) {
  try {
    const dns = process.env.EVO_DNS;
    const token = process.env.EVO_TOKEN;
    const username = process.env.EVO_USERNAME;

    if (!dns || !token) {
      return null;
    }

    const evoClient = createEvoClient({
      dns,
      apiKey: token,
      username,
    });

    const member = await evoClient.getMember(memberId);
    
    if (!member) return null;

    const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
    return {
      name: fullName || "Sin nombre",
      email: extractEmail(member.contacts),
      phone: extractPhone(member.contacts),
      photoUrl: member.photoUrl,
      initials: getInitials(member.firstName, member.lastName),
    };
  } catch (error) {
    console.error("[EVO] Error fetching member:", error);
    return null;
  }
}

function checkAuth(request: Request) {
  const token = getBearerToken(request.headers.get("authorization"));
  return token && verifyAuthToken(token);
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
  });

  const results = await Promise.all(
    appointments.map(async (apt) => {
      let clientInfo = null;

      if (apt.clientId) {
        clientInfo = await getEvoMemberInfo(apt.clientId);
        if (!clientInfo) {
          clientInfo = {
            name: "Cliente Evo",
            email: "",
            phone: "",
            photoUrl: null,
            initials: "?",
          };
        }
      }

      return {
        id: apt.id,
        client: clientInfo?.name || "Cliente Evo",
        clientId: apt.clientId,
        clientInfo,
        time: apt.time ? `${apt.time} hrs` : "",
        date: apt.date,
        type: apt.title,
        instructor: apt.location || "Sin asignar",
        status: apt.status === "CONFIRMED" ? "Confirmed" : "Pending",
        duration: apt.duration,
      };
    })
  );

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, date, time, clientId, location, notes, duration } = body;

    if (!title || !date) {
      return NextResponse.json({ detail: "Title and date are required" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        title,
        date,
        time: time || null,
        clientId: clientId ? Number(clientId) : null,
        location: location || null,
        notes: notes || null,
        duration: duration ? Number(duration) : null,
        status: "PENDING",
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
