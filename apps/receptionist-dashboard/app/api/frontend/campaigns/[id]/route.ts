import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createApiError } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: Number(id) },
    });
    
    if (!campaign) {
      return NextResponse.json(createApiError("Campaign not found", 404), { status: 404 });
    }
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[CAMPAIGNS] Error fetching campaign:", error);
    return NextResponse.json(createApiError("Failed to fetch campaign", 500), { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    await prisma.campaign.delete({ where: { id: Number(id) } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CAMPAIGNS] Error deleting campaign:", error);
    return NextResponse.json(createApiError("Failed to delete campaign", 500), { status: 500 });
  }
}

// Mapeo de segmentos a clientId
const segmentToClientId: Record<string, number> = {
  'all': 1,
  'students': 2,
  'professionals': 3,
  'public': 4,
  'premium': 5,
  'inactive': 6,
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, content, target_segments, start_date, end_date } = body;

    // Determinar clientId basado en segmentos si se proporcionan
    let finalClientId = undefined;
    if (target_segments && target_segments.length > 0) {
      const firstSegment = target_segments[0];
      finalClientId = segmentToClientId[firstSegment] || undefined;
    }

    const campaign = await prisma.campaign.update({
      where: { id: Number(id) },
      data: {
        name: name || undefined,
        description: description || null,
        content: content || null,
        ...(finalClientId && { clientId: finalClientId }),
        startDate: start_date ? new Date(start_date) : undefined,
        endDate: end_date ? new Date(end_date) : undefined,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[CAMPAIGNS] Error updating campaign:", error);
    return NextResponse.json(createApiError("Failed to update campaign", 500), { status: 500 });
  }
}
