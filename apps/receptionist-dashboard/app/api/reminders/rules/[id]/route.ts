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
  const ruleId = Number(id);

  await prisma.ruleTarget.deleteMany({ where: { ruleId } });

  const rule = await prisma.reminderRule.update({
    where: { id: ruleId },
    data: {
      name: body.name,
      description: body.description || null,
      ruleType: body.rule_type,
      daysBefore: Number(body.days_before || 0),
      daysAfter: Number(body.days_after || 0),
      templateMessage: body.template_message,
      sendHour: Number(body.send_hour || 9),
      isActive: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      targets: {
        create: (body.targets || []).map((target: typeof body.targets[0]) => ({
          targetType: target.target_type,
          targetValue: target.target_value || null,
        })),
      },
    },
    include: { targets: true },
  });

  return NextResponse.json(rule);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.reminderRule.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
