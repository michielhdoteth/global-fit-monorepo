import { NextResponse } from "next/server";
import { requireUser } from "@/lib/token-auth";

async function testConnection(provider: string, apiKey?: string, baseUrl?: string) {
  const urlBase = baseUrl || (provider === "openai" ? "https://api.openai.com" : "https://api.deepseek.com");
  const response = await fetch(`${urlBase}/v1/models`, {
    headers: {
      Authorization: `Bearer ${apiKey || ""}`,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Connection test failed");
  }
  return true;
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const provider = body.provider || "deepseek";
  const apiKey = body.api_key || "";
  const baseUrl = body.base_url || undefined;

  if (!apiKey) {
    return NextResponse.json({ success: false, message: "API key is required" }, { status: 400 });
  }

  try {
    await testConnection(provider, apiKey, baseUrl);
    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    });
  }
}
