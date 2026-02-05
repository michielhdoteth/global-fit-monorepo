import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireUser } from "@/lib/token-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules = await prisma.keywordRule.findMany({
      orderBy: { priority: 'desc' }
    });

    return NextResponse.json(
      rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        keywords: rule.keywords,
        match_type: rule.matchType,
        response_type: rule.responseType,
        response_content: rule.responseContent,
        priority: rule.priority,
        is_enabled: rule.isEnabled,
        case_sensitive: rule.caseSensitive,
        created_at: rule.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching keyword rules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    if (!name || !keywords || !keywords.length || !response_content?.body) {
      return NextResponse.json(
        { success: false, error: "name, keywords, and response_content.body are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.keywordRule.create({
      data: {
        name,
        keywords,
        matchType: match_type || "contains",
        responseType: response_type || "text",
        responseContent: response_content,
        priority: priority || 100,
        isEnabled: true,
        caseSensitive: case_sensitive || false,
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
    console.error("Error creating keyword rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
