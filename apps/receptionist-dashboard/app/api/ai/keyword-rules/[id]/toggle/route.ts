import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.keywordRule.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const rule = await prisma.keywordRule.update({
      where: { id: parseInt(id) },
      data: { isEnabled: !existing.isEnabled },
    });

    return NextResponse.json({
      id: rule.id,
      is_enabled: rule.isEnabled,
    });
  } catch (error) {
    console.error("Error toggling keyword rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle rule" },
      { status: 500 }
    );
  }
}
