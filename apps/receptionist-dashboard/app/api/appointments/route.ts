import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils";
import { z } from "zod";
import { createEvoClient, EvoMember } from "@/lib/evo-api";

const createAppointmentSchema = z.object({
  title: z.string(),
  date: z.string(),
  time: z.string().optional(),
  clientId: z.number().optional(),
  duration: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

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

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "10");
    const clientId = req.nextUrl.searchParams.get("clientId");

    const skip = (page - 1) * pageSize;
    const where = clientId ? { clientId: parseInt(clientId) } : {};

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { date: "desc" },
        include: { client: true },
      }),
      prisma.appointment.count({ where }),
    ]);

    if (appointments.length === 0) {
      return NextResponse.json(paginatedResponse([], page, pageSize, total));
    }

    const dns = process.env.EVO_DNS;
    const token = process.env.EVO_TOKEN;
    const username = process.env.EVO_USERNAME;

    let evoClient = null;
    if (dns && token) {
      evoClient = createEvoClient({
        dns,
        apiKey: token,
        username,
      });
    }

    const enrichedAppointments = await Promise.all(
      appointments.map(async (apt) => {
        let clientData: {
          name: string;
          email: string;
          phone: string;
          photoUrl: string | null;
          initials: string;
        } = {
          name: apt.client?.name || "Cliente no encontrado",
          email: apt.client?.email || "",
          phone: apt.client?.phone || "",
          photoUrl: null,
          initials: getInitials(),
        };

        if (evoClient && apt.client?.clientId) {
          try {
            const evoMember = await evoClient.getMember(apt.client.clientId);
            if (evoMember) {
              const fullName = `${evoMember.firstName || ""} ${evoMember.lastName || ""}`.trim();
              clientData = {
                name: fullName || "Sin nombre",
                email: extractEmail(evoMember.contacts),
                phone: extractPhone(evoMember.contacts),
                photoUrl: evoMember.photoUrl || null,
                initials: getInitials(evoMember.firstName, evoMember.lastName),
              };
            }
          } catch (error) {
            console.error(`[APPOINTMENTS] Error fetching Evo member ${apt.client.clientId}:`, error);
          }
        }

        return {
          id: apt.id,
          client: clientData.name,
          clientId: apt.clientId,
          time: apt.time ? `${apt.time} hrs` : "",
          date: apt.date,
          type: apt.title,
          instructor: apt.location || "Sin asignar",
          status: apt.status === "CONFIRMED" ? "Confirmed" : "Pending",
          clientInfo: clientData,
          duration: apt.duration,
        };
      })
    );

    return NextResponse.json(paginatedResponse(enrichedAppointments, page, pageSize, total));
  } catch (error) {
    console.error("[APPOINTMENTS] Error fetching appointments:", error);
    return NextResponse.json(errorResponse("Failed to fetch appointments"), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createAppointmentSchema.parse(body);

    const { clientId, ...rest } = data;
    const appointment = await prisma.appointment.create({
      data: {
        ...rest,
        status: "PENDING",
        ...(clientId && { clientId }),
      },
    });

    return NextResponse.json(successResponse(appointment), { status: 201 });
  } catch (error) {
    return NextResponse.json(errorResponse("Failed to create appointment"), { status: 500 });
  }
}
