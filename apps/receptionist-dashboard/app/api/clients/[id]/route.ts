import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";
import { successResponse, errorResponse } from "@/lib/utils";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  plan: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: { appointments: true, leads: true },
    });

    if (!client) {
      return NextResponse.json(errorResponse("Client not found"), { status: 404 });
    }

    return NextResponse.json(successResponse(client));
  } catch (error) {
    return NextResponse.json(errorResponse("Failed to fetch client"), { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const body = await req.json();
    const data = updateClientSchema.parse(body);
    const updateData = {
      ...data,
      status: (data.status || undefined) as any,
    };

    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(successResponse(client));
  } catch (error) {
    return NextResponse.json(errorResponse("Failed to update client"), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.client.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(successResponse({ message: "Client deleted" }));
  } catch (error) {
    return NextResponse.json(errorResponse("Failed to delete client"), { status: 500 });
  }
}
