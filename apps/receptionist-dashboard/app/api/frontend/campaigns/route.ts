import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { mapCampaignStatus, createApiError } from "@/lib/utils";

// Función para determinar si una campaña está activa basada en las fechas
function isCampaignActive(campaign: any): boolean {
  if (campaign.status !== 'ACTIVE') return false;
  
  const now = new Date();
  
  // Si tiene fecha de inicio y es futura, no está activa
  if (campaign.startDate && new Date(campaign.startDate) > now) {
    return false;
  }
  
  // Si tiene fecha de fin y ya pasó, no está activa
  if (campaign.endDate && new Date(campaign.endDate) < now) {
    return false;
  }
  
  return true;
}

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
    console.log("[CAMPAIGNS] Found campaigns:", campaigns.length);
    
    return NextResponse.json(
      campaigns.map(campaign => {
        // Determinar si está activa basado en las fechas
        const isActive = isCampaignActive(campaign);
        
        return {
          id: campaign.id, name: campaign.name, description: campaign.description,
          status: isActive ? 'Active' : mapCampaignStatus(campaign.status),
          sent_count: 0, delivered_count: 0, read_count: 0, delivery_rate: 0,
          scheduled_date: null,
          created_at: campaign.createdAt.toISOString(),
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        };
      })
    );
  } catch (error) {
    console.error("[CAMPAIGNS] Error fetching campaigns:", error);
    return NextResponse.json(createApiError("Failed to fetch campaigns", 500), { status: 500 });
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[CAMPAIGNS] Creating campaign with body:", body);
    const { 
      name, 
      description, 
      template_content, 
      content, 
      media_type, 
      client_id,
      target_segments,
      start_date,
      end_date
    } = body;

    if (!name) {
      console.log("[CAMPAIGNS] Missing name");
      return NextResponse.json(createApiError("Name is required", 400), { status: 400 });
    }

    const campaignContent = template_content || content || '';

    // Determinar clientId basado en segmentos
    let finalClientId = client_id ? Number(client_id) : null;
    if (!finalClientId && target_segments && target_segments.length > 0) {
      // Usar el primer segmento seleccionado para determinar el clientId
      const firstSegment = target_segments[0];
      finalClientId = segmentToClientId[firstSegment] || 1;
    }
    
    // Si no hay clientId, usar el primero por defecto
    if (!finalClientId) {
      const defaultClient = await prisma.client.findFirst({ orderBy: { id: 'asc' } });
      finalClientId = defaultClient?.id || 1;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        type: media_type,
        content: campaignContent,
        status: "DRAFT",
        clientId: finalClientId,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
      },
    });

    console.log("[CAMPAIGNS] Campaign created:", campaign);
    return NextResponse.json({ id: campaign.id, name: campaign.name, status: "Draft" });
  } catch (error) {
    console.error("[CAMPAIGNS] Error creating campaign:", error);
    return NextResponse.json(createApiError("Failed to create campaign", 500), { status: 500 });
  }
}
