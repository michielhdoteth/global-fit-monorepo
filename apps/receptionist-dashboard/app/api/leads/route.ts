import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils";
import { z } from "zod";

const createLeadSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.number(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "10");
    const status = req.nextUrl.searchParams.get("status");

    const skip = (page - 1) * pageSize;
    const where = status ? { status: status.toUpperCase() as any } : {};

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(leads, page, pageSize, total));
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(errorResponse("Failed to fetch leads"), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createLeadSchema.parse(body);
    const { status, ...rest } = data;
    const statusValue = (status ? status.toUpperCase() : "NEW") as any;

    const lead = await prisma.lead.create({
      data: { ...rest, status: statusValue },
    });

    return NextResponse.json(successResponse(lead), { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(errorResponse("Failed to create lead"), { status: 500 });
  }
}
