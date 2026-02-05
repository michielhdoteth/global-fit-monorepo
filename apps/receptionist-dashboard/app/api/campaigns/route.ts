import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientId = body.client_id ? Number(body.client_id) : null;
  const fallbackClient = clientId
    ? null
    : await prisma.client.findFirst({ orderBy: { createdAt: "asc" } });
  const resolvedClientId = clientId || fallbackClient?.id;
  if (!resolvedClientId) {
    return NextResponse.json({ detail: "Client is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      description: body.description || null,
      status: "DRAFT",
      type: body.media_type || null,
      content: body.template_content || body.content || null,
      clientId: resolvedClientId,
      startDate: new Date(),
      endDate: null,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
