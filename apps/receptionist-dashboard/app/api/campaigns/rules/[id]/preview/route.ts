import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleId = parseInt(id);

    const rule = await prisma.campaignRule.findUnique({
      where: { id: ruleId },
      include: {
        targets: true,
      },
    });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    // Get sample clients based on targets
    let clients = await prisma.client.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
      },
    });

    // Filter by target if specified
    const targetsByType = rule.targets.reduce((acc: Record<string, (string | null)[]>, t: typeof rule.targets[0]) => {
      if (!acc[t.targetType]) acc[t.targetType] = [];
      acc[t.targetType].push(t.targetValue);
      return acc;
    }, {} as Record<string, (string | null)[]>);

    if (targetsByType['specific_plan'] && targetsByType['specific_plan'].length > 0) {
      clients = clients.filter((c: typeof clients[0]) => targetsByType['specific_plan'].includes(c.plan));
    }

    if (targetsByType['specific_status'] && targetsByType['specific_status'].length > 0) {
      clients = clients.filter((c: typeof clients[0]) => targetsByType['specific_status'].includes(c.status));
    }

    // Get total affected clients
    const totalAffected = await prisma.client.count();

    const sampleCampaigns = clients.map((client: typeof clients[0]) => ({
      client: client.name,
      email: client.email || 'N/A',
      content_preview: rule.templateContent.substring(0, 150),
    }));

    return NextResponse.json({
      rule_id: rule.id,
      rule_name: rule.name,
      rule_type: rule.ruleType,
      total_affected_clients: totalAffected,
      sample_campaigns: sampleCampaigns,
    });
  } catch (error) {
    console.error("Error fetching preview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch preview" },
      { status: 500 }
    );
  }
}
