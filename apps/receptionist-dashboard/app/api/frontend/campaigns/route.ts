import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { mapCampaignStatus, createApiError } from "@/lib/utils";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });

    return NextResponse.json(
      campaigns.map((campaign: any) => ({
        id: campaign.id, name: campaign.name, description: campaign.description,
        status: mapCampaignStatus(campaign.status),
        sent_count: 0, delivered_count: 0, read_count: 0, delivery_rate: 0,
        scheduled_date: campaign.startDate?.toISOString().slice(0, 10) || null,
        created_at: campaign.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("[CAMPAIGNS] Error fetching campaigns:", error);
    return NextResponse.json(createApiError("Failed to fetch campaigns", 500), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, type, content, client_id } = body;

    if (!name) {
      return NextResponse.json(createApiError("Name is required", 400), { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name, description, type, content,
        status: "DRAFT",
        clientId: client_id ? Number(client_id) : 1,
      },
    });

    return NextResponse.json({ id: campaign.id, name: campaign.name, status: "Draft" });
  } catch (error) {
    console.error("[CAMPAIGNS] Error creating campaign:", error);
    return NextResponse.json(createApiError("Failed to create campaign", 500), { status: 500 });
  }
}
