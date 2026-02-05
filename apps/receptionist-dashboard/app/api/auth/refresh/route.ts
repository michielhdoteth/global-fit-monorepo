import { NextResponse } from "next/server";
import { getBearerToken, verifyAuthToken, signAuthToken } from "@/lib/token-auth";

export async function POST(request: Request) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const refreshed = signAuthToken({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  });

  return NextResponse.json({ access_token: refreshed, token_type: "bearer" });
}
