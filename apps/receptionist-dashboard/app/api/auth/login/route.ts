import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { signAuthToken, verifyPassword } from "@/lib/token-auth";

console.log('[LOGIN] Starting login request');

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
  console.log('[LOGIN] Processing login request');
  const body = await readFormBody(request);
  const email = (body.username || body.email || "").toLowerCase().trim();
  const password = body.password || "";
  const isDevBypass = body.dev_bypass === "true";

  console.log('[LOGIN] Email:', email);

  // Dev bypass - works in any environment
  if (body.dev_bypass === "true") {
    console.log('[LOGIN] Dev bypass enabled, finding admin user...');
    const user = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
    
    if (!user || !user.isActive) {
      console.log('[LOGIN] No admin user found for dev bypass');
      return NextResponse.json({ detail: "No admin user found" }, { status: 404 });
    }

    console.log('[LOGIN] Dev bypass login successful for:', user.email);
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

  if (!email || !password) {
    console.log('[LOGIN] Missing credentials');
    return NextResponse.json({ detail: "Missing credentials" }, { status: 400 });
  }

  console.log('[LOGIN] Finding user...');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    console.log('[LOGIN] User not found or inactive');
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }

  console.log('[LOGIN] User found, verifying password...');
  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) {
    console.log('[LOGIN] Invalid password');
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }

  console.log('[LOGIN] Password valid, generating token...');
  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  console.log('[LOGIN] Login successful!');
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
