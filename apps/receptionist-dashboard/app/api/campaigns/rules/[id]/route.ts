import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleId = parseInt(id);
    const body = await request.json();
    const {
      name,
      description,
      rule_type,
      trigger_event,
      template_content,
      send_hour,
      targets,
    } = body;

    // Delete existing targets
    await prisma.campaignRuleTarget.deleteMany({
      where: { ruleId },
    });

    // Update rule
    const rule = await prisma.campaignRule.update({
      where: { id: ruleId },
      data: {
        name,
        description: description || null,
        ruleType: rule_type,
        triggerEvent: trigger_event,
        templateContent: template_content,
        sendHour: send_hour,
        targets: targets ? {
          create: targets.map((t: typeof targets[0]) => ({
            targetType: t.target_type,
            targetValue: t.target_value || null,
          })),
        } : undefined,
      },
      include: {
        targets: true,
      },
    });

    return NextResponse.json({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      rule_type: rule.ruleType,
      trigger_event: rule.triggerEvent,
      template_content: rule.templateContent,
      is_active: rule.isActive,
      send_hour: rule.sendHour,
      targets: rule.targets,
    });
  } catch (error) {
    console.error("Error updating campaign rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleId = parseInt(id);

    await prisma.campaignRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
