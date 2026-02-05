import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      keywords,
      match_type,
      response_type,
      response_content,
      priority,
      case_sensitive,
    } = body;

    const rule = await prisma.keywordRule.update({
      where: { id: parseInt(id) },
      data: {
        name,
        keywords,
        matchType: match_type,
        responseType: response_type,
        responseContent: response_content,
        priority,
        caseSensitive: case_sensitive,
      },
    });

    return NextResponse.json({
      id: rule.id,
      name: rule.name,
      keywords: rule.keywords,
      match_type: rule.matchType,
      response_type: rule.responseType,
      response_content: rule.responseContent,
      priority: rule.priority,
      is_enabled: rule.isEnabled,
      case_sensitive: rule.caseSensitive,
    });
  } catch (error) {
    console.error("Error updating keyword rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.keywordRule.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting keyword rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
