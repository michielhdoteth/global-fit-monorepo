import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const rules = await prisma.campaignRule.findMany({
      include: {
        targets: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      rules.map((rule: typeof rules[0]) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        rule_type: rule.ruleType,
        trigger_event: rule.triggerEvent,
        template_content: rule.templateContent,
        is_active: rule.isActive,
        send_hour: rule.sendHour,
        targets: rule.targets.map((t: typeof rule.targets[0]) => ({
          id: t.id,
          target_type: t.targetType,
          target_value: t.targetValue,
        })),
      }))
    );
  } catch (error) {
    console.error("Error fetching campaign rules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    if (!name || !template_content) {
      return NextResponse.json(
        { success: false, error: "Name and template_content are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.campaignRule.create({
      data: {
        name,
        description: description || null,
        ruleType: rule_type,
        triggerEvent: trigger_event,
        templateContent: template_content,
        sendHour: send_hour || 9,
        isActive: true,
        targets: targets ? {
          create: targets.map((t: any) => ({
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
    console.error("Error creating campaign rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
