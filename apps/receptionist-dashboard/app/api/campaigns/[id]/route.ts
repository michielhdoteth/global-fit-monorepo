import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const campaign = await prisma.campaign.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      description: body.description || null,
      status: body.status || undefined,
      type: body.type || null,
      content: body.content || null,
      startDate: body.start_date ? new Date(body.start_date) : undefined,
      endDate: body.end_date ? new Date(body.end_date) : undefined,
    },
  });

  return NextResponse.json(campaign);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  // Solo ADMIN o SUPER_ADMIN pueden borrar campañas
  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json({ detail: "Forbidden - Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.campaign.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
