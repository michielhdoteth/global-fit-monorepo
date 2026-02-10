import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";
import { getEvoClientFromDb } from "@/lib/evo-api";

async function safeDbCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("DB call failed:", error);
    return fallback;
  }
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
  const { syncType = "all", options = {} } = body;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("host") || "http://localhost:3000";
  const authToken = request.headers.get("authorization");

  const results: any = {
    members: null,
    visits: null,
    payments: null,
  };

  const syncPromises: Promise<void>[] = [];

  if (syncType === "all" || syncType === "members") {
    syncPromises.push(
      (async () => {
        try {
          const response = await fetch(`${baseUrl}/api/evo/sync/members`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken || "",
            },
            body: JSON.stringify(options.members || { syncAll: true, limit: 100 }),
          });
          results.members = await response.json();
        } catch (error) {
          results.members = { error: error instanceof Error ? error.message : "Failed to sync members" };
        }
      })()
    );
  }

  if (syncType === "all" || syncType === "visits") {
    syncPromises.push(
      (async () => {
        try {
          const response = await fetch(`${baseUrl}/api/evo/sync/visits`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken || "",
            },
            body: JSON.stringify(options.visits || { limit: 500 }),
          });
          results.visits = await response.json();
        } catch (error) {
          results.visits = { error: error instanceof Error ? error.message : "Failed to sync visits" };
        }
      })()
    );
  }

  if (syncType === "all" || syncType === "payments") {
    syncPromises.push(
      (async () => {
        try {
          const response = await fetch(`${baseUrl}/api/evo/sync/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken || "",
            },
            body: JSON.stringify(options.payments || { limit: 500 }),
          });
          results.payments = await response.json();
        } catch (error) {
          results.payments = { error: error instanceof Error ? error.message : "Failed to sync payments" };
        }
      })()
    );
  }

  await Promise.all(syncPromises);

  const hasErrors = Object.values(results).some(
    (r: any) => r && (r.error || !r.success)
  );

  return NextResponse.json({
    success: !hasErrors,
    message: hasErrors
      ? "Sync completed with some errors"
      : "All sync operations completed successfully",
    results,
    syncedAt: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const evoSettings = await safeDbCall(
    () => prisma.evoSettings.findFirst(),
    null
  );
  if (!evoSettings) {
    return NextResponse.json({ configured: false, enabled: false });
  }

  const [totalClients, syncedClients, totalCheckIns, clientsWithPayments, lastMemberSync, lastCheckIn] = await Promise.all([
    safeDbCall(() => prisma.client.count(), 0),
    safeDbCall(() => prisma.evoSync.count({ where: { syncStatus: "success" } }), 0),
    safeDbCall(() => prisma.checkIn.count(), 0),
    safeDbCall(() => prisma.client.count({ where: { notes: { contains: "[EVO Payments]" } } }), 0),
    safeDbCall(() => prisma.evoSync.findFirst({ where: { syncStatus: "success" }, orderBy: { lastSyncAt: "desc" } }), null),
    safeDbCall(() => prisma.checkIn.findFirst({ orderBy: { createdAt: "desc" } }), null),
  ]);

  return NextResponse.json({
    configured: Boolean(evoSettings.apiKey),
    enabled: evoSettings.isEnabled,
    stats: {
      members: {
        total: totalClients,
        synced: syncedClients,
        lastSync: lastMemberSync?.lastSyncAt,
      },
      visits: {
        total: totalCheckIns,
        lastEntry: lastCheckIn?.timestamp,
      },
      payments: {
        clientsWithData: clientsWithPayments,
      },
    },
  });
}
