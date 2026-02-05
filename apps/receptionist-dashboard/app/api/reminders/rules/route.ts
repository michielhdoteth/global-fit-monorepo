import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.reminderRule.findMany({
    include: { targets: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rule = await prisma.reminderRule.create({
    data: {
      name: body.name,
      description: body.description || null,
      ruleType: body.rule_type,
      daysBefore: Number(body.days_before || 0),
      daysAfter: Number(body.days_after || 0),
      templateMessage: body.template_message,
      isActive: Boolean(body.is_active ?? true),
      sendHour: Number(body.send_hour || 9),
      targets: {
        create: (body.targets || []).map((target: typeof body.targets[0]) => ({
          targetType: target.target_type,
          targetValue: target.target_value || null,
        })),
      },
    },
    include: { targets: true },
  });
  return NextResponse.json(rule, { status: 201 });
}
