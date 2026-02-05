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

  const body = await request.json();
  const { id } = await params;
  const teamId = Number(id);
  const data: Record<string, any> = {};
  if (body.name) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;

  const team = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  return NextResponse.json(team);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const teamId = Number(id);
  await prisma.team.delete({ where: { id: teamId } });
  return NextResponse.json({ success: true });
}
