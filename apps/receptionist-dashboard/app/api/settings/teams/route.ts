import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const description = body.description ? String(body.description).trim() : null;

  if (!name) {
    return NextResponse.json({ detail: "Name is required" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name,
      description,
    },
  });

  return NextResponse.json(team);
}
