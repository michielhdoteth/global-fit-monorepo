import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { signAuthToken, verifyPassword } from "@/lib/token-auth";

async function readFormBody(request: Request): Promise<Record<string, string>> {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await request.json()) as Record<string, string>;
    }
    const formData = await request.formData();
    const data: Record<string, string> = {};
    formData.forEach((value: FormDataEntryValue, key: string) => {
      data[key] = String(value);
    });
    return data;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await readFormBody(request);
  const email = (body.username || body.email || "").toLowerCase().trim();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ detail: "Missing credentials" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }

  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({
    access_token: token,
    token_type: "bearer",
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role.toLowerCase(),
      team_id: user.teamId,
    },
  });

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
