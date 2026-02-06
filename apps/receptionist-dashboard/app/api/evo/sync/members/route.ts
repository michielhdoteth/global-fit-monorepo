import { NextResponse } from "next/server";
import { requireUser } from "@/lib/token-auth";
import { getEvoClientFromDb, type EvoMember } from "@/lib/evo-api";

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
  const { syncAll = true, idMember, limit = 100 } = body;

  try {
    const result: SyncResult = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    let members: EvoMember[] | null = null;

    if (idMember) {
      const member = await evoClient.getMember(idMember);
      members = member ? [member] : null;
    } else if (syncAll) {
      members = await evoClient.getMembers({ pageSize: limit });
    } else {
      members = await evoClient.getActiveMembers();
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No members found to sync",
        result,
      });
    }

    const prisma = (await import("@/lib/db")).default;

    for (const member of members) {
      try {
        const evoMemberId = String(member.idMember);
        const email = member.email || `${evoMemberId}@evo.local`;

        const existingClient = await prisma.client.findUnique({
          where: { email },
        });

        const isActive = member.status?.toLowerCase() === "active";

        if (existingClient) {
          await prisma.client.update({
            where: { id: existingClient.id },
            data: {
              name: member.name,
              email,
              phone: member.phone,
              whatsappNumber: member.phone,
              planDetails: member.status ? `Status: ${member.status}` : null,
              status: isActive ? "CLIENT" : "PROSPECTO",
              customField1: evoMemberId,
              customField2: member.idBranch ? String(member.idBranch) : null,
            },
          });
          result.updated++;
        } else {
          await prisma.client.create({
            data: {
              name: member.name,
              email,
              phone: member.phone,
              whatsappNumber: member.phone,
              planDetails: member.status ? `Status: ${member.status}` : null,
              status: isActive ? "CLIENT" : "PROSPECTO",
              customField1: evoMemberId,
              customField2: member.idBranch ? String(member.idBranch) : null,
            },
          });
          result.created++;
        }

        const client = await prisma.client.findUnique({
          where: { email },
        });

        if (client) {
          const existingSync = await prisma.evoSync.findFirst({
            where: { clientId: client.id },
          });

          if (existingSync) {
            await prisma.evoSync.update({
              where: { id: existingSync.id },
              data: {
                evoMemberId,
                lastSyncAt: new Date(),
                syncStatus: "success",
              },
            });
          } else {
            await prisma.evoSync.create({
              data: {
                clientId: client.id,
                evoMemberId,
                lastSyncAt: new Date(),
                syncStatus: "success",
              },
            });
          }
        }
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Member ${member.idMember}: ${errorMsg}`);
        console.error(`[EVO_SYNC] Failed to sync member ${member.idMember}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
      result,
    });
  } catch (error) {
    console.error("[EVO_SYNC] Sync error:", error);
    return NextResponse.json(
      {
        detail: "Sync failed",
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

  const prisma = (await import("@/lib/db")).default;

  const evoSettings = await prisma.evoSettings.findFirst();
  if (!evoSettings || !evoSettings.isEnabled) {
    return NextResponse.json(
      { detail: "EVO integration not configured or disabled" },
      { status: 400 }
    );
  }

  const totalClients = await prisma.client.count();
  const syncedClients = await prisma.evoSync.count({
    where: { syncStatus: "success" },
  });

  const recentSyncs = await prisma.evoSync.findMany({
    where: { syncStatus: "success" },
    orderBy: { lastSyncAt: "desc" },
    take: 10,
    include: { client: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    configured: true,
    enabled: evoSettings.isEnabled,
    stats: {
      totalClients,
      syncedClients,
      syncRate: totalClients > 0 ? ((syncedClients / totalClients) * 100).toFixed(1) + "%" : "0%",
    },
    recentSyncs: recentSyncs.map((sync) => ({
      clientId: sync.clientId,
      clientName: sync.client?.name || "Unknown",
      clientEmail: sync.client?.email || "Unknown",
      evoMemberId: sync.evoMemberId,
      lastSyncAt: sync.lastSyncAt,
    })),
  });
}
