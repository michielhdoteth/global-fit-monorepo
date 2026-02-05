import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse, paginatedResponse } from "@repo/utils";
import { z } from "zod";

const createAppointmentSchema = z.object({
  title: z.string(),
  date: z.string(), // YYYY-MM-DD
  time: z.string().optional(),
  clientId: z.number(),
  duration: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

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

    return NextResponse.json(paginatedResponse(appointments, page, pageSize, total));
  } catch (error) {
    return NextResponse.json(errorResponse("Failed to fetch appointments"), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createAppointmentSchema.parse(body);

    const appointment = await prisma.appointment.create({
      data: { ...data, status: "PENDING" },
    });

    return NextResponse.json(successResponse(appointment), { status: 201 });
  } catch (error) {
    return NextResponse.json(errorResponse("Failed to create appointment"), { status: 500 });
  }
}
