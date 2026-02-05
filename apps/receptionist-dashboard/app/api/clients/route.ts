import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  plan: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "10");
    const search = req.nextUrl.searchParams.get("search");

    const skip = (page - 1) * pageSize;
    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as any } }, { email: { contains: search } }] }
      : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json(
      paginatedResponse(clients, page, pageSize, total)
    );
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(errorResponse("Failed to fetch clients"), { status: 500 });
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
    const data = createClientSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        ...data,
        status: "PENDING",
      },
    });

    return NextResponse.json(successResponse(client), { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(errorResponse("Failed to create client"), { status: 500 });
  }
}
