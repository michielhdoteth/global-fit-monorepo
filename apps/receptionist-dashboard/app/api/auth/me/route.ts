import { NextResponse } from "next/server";
import { requireUser } from "@/lib/token-auth";

export async function GET(request: Request) {
  const user = await requireUser(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role.toLowerCase(),
    team_id: user.teamId,
  });
}
