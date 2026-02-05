import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ruleId = Number(id);
  const rule = await prisma.reminderRule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const updated = await prisma.reminderRule.update({
    where: { id: ruleId },
    data: { isActive: !rule.isActive },
  });

  return NextResponse.json(updated);
}
