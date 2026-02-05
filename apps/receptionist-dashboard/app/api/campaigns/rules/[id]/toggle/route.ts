import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleId = parseInt(id);

    const rule = await prisma.campaignRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.campaignRule.update({
      where: { id: ruleId },
      data: {
        isActive: !rule.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      is_active: updated.isActive,
    });
  } catch (error) {
    console.error("Error toggling campaign rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle rule" },
      { status: 500 }
    );
  }
}
