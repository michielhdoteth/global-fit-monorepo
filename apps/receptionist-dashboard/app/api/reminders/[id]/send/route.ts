import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const reminder = await prisma.reminder.findUnique({
    where: { id: Number(id) },
  });

  return NextResponse.json({ success: true, reminder });
}
