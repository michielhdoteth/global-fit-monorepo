import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, requireUser } from "@/lib/token-auth";

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const fullName = String(body.full_name || body.fullName || "").trim();
  const role = String(body.role || "STAFF").toUpperCase();
  const teamId = body.team_id ? Number(body.team_id) : null;

  if (!email || !password || !fullName) {
    return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ detail: "User already exists" }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      fullName,
      role: role as any,
      teamId,
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role.toLowerCase(),
    team_id: user.teamId,
  });
}
