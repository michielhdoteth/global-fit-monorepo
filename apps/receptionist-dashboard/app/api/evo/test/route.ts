import { NextResponse } from "next/server";
import { requireUser } from "@/lib/token-auth";

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const dns = body.dns || "";
  if (!dns) {
    return NextResponse.json({ success: false, message: "DNS is required" }, { status: 400 });
  }

  try {
    const response = await fetch(dns, { method: "HEAD" });
    if (!response.ok) {
      return NextResponse.json({ success: false, message: `HTTP ${response.status}` });
    }
    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    });
  }
}
