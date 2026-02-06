import { NextResponse } from "next/server";
import { requireUser } from "@/lib/token-auth";
import { getEvoClientFromDb, type EvoVisit } from "@/lib/evo-api";

interface SyncResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export async function POST(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const evoClient = await getEvoClientFromDb();
  if (!evoClient) {
    return NextResponse.json(
      { detail: "EVO integration not configured or disabled" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { startDate, endDate, limit = 500 } = body;

  try {
    const result: SyncResult = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    const prisma = (await import("@/lib/db")).default;

    const visits = await evoClient.getEntries({
      startDate,
      endDate,
      pageSize: limit,
    });

    if (!visits || visits.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No visits found to sync",
        result,
      });
    }

    for (const visit of visits) {
      try {
        const evoMemberId = String(visit.idMember);

        const evoSync = await prisma.evoSync.findFirst({
          where: { evoMemberId },
        });

        if (!evoSync) {
          result.failed++;
          result.errors.push(`Visit ${visit.idEntry}: No client found for EVO member ${evoMemberId}`);
          continue;
        }

        const existingCheckIn = await prisma.checkIn.findFirst({
          where: {
            clientId: evoSync.clientId,
            timestamp: new Date(visit.entryDate),
          },
        });

        if (existingCheckIn) {
          await prisma.checkIn.update({
            where: { id: existingCheckIn.id },
            data: {
              notes: visit.turnstile ? `Turnstile: ${visit.turnstile}, Branch: ${visit.idBranch}` : `Branch: ${visit.idBranch}`,
            },
          });
          result.updated++;
        } else {
          await prisma.checkIn.create({
            data: {
              clientId: evoSync.clientId,
              timestamp: new Date(visit.entryDate),
              notes: visit.turnstile ? `Turnstile: ${visit.turnstile}, Branch: ${visit.idBranch}` : `Branch: ${visit.idBranch}`,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Visit ${visit.idEntry}: ${errorMsg}`);
        console.error(`[EVO_SYNC_VISITS] Failed to sync visit ${visit.idEntry}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Visits sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
      result,
    });
  } catch (error) {
    console.error("[EVO_SYNC_VISITS] Sync error:", error);
    return NextResponse.json(
      {
        detail: "Visits sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const prisma = (await import("@/lib/db")).default;

  const evoSettings = await prisma.evoSettings.findFirst();
  if (!evoSettings || !evoSettings.isEnabled) {
    return NextResponse.json(
      { detail: "EVO integration not configured or disabled" },
      { status: 400 }
    );
  }

  const where: any = {};
  if (clientId) where.clientId = parseInt(clientId);
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const checkIns = await prisma.checkIn.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 100,
    include: { client: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    configured: true,
    enabled: evoSettings.isEnabled,
    checkIns: checkIns.map((checkIn) => ({
      id: checkIn.id,
      clientId: checkIn.clientId,
      clientName: checkIn.client?.name || "Unknown",
      timestamp: checkIn.timestamp,
      notes: checkIn.notes,
    })),
  });
}
