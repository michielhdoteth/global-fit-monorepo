import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, requireUser } from "@/lib/token-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = await params;
  const updates: Record<string, any> = {};

  if (body.email) updates.email = String(body.email).toLowerCase().trim();
  if (body.full_name || body.fullName) updates.fullName = String(body.full_name || body.fullName).trim();
  if (body.role) updates.role = String(body.role).toUpperCase();
  if (body.team_id !== undefined) updates.teamId = body.team_id ? Number(body.team_id) : null;
  if (body.is_active !== undefined) updates.isActive = Boolean(body.is_active);

  if (body.password) {
    updates.hashedPassword = await hashPassword(String(body.password));
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: updates,
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role.toLowerCase(),
    team_id: user.teamId,
    is_active: user.isActive,
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role.toLowerCase(),
    team_id: user.teamId,
    is_active: user.isActive,
  });
}
