import { NextResponse } from "next/server";
import { requireUser } from "@/lib/token-auth";
import { getEvoClientFromDb, type EvoReceivable } from "@/lib/evo-api";

interface SyncResult {
  processed: number;
  failed: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
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
  const { startDate, endDate, status, limit = 500 } = body;

  try {
    const result: SyncResult = {
      processed: 0,
      failed: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      errors: [],
    };

    const prisma = (await import("@/lib/db")).default;

    const receivables = await evoClient.getReceivables({
      startDate,
      endDate,
      status,
      pageSize: limit,
    });

    if (!receivables || receivables.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No payments found to sync",
        result,
      });
    }

    const clientPaymentMap = new Map<number, any[]>();

    for (const receivable of receivables) {
      try {
        const evoMemberId = String(receivable.idMember);

        const evoSync = await prisma.evoSync.findFirst({
          where: { evoMemberId },
        });

        if (!evoSync) {
          result.failed++;
          result.errors.push(`Receivable ${receivable.idReceivable}: No client found for EVO member ${evoMemberId}`);
          continue;
        }

        if (!clientPaymentMap.has(evoSync.clientId)) {
          clientPaymentMap.set(evoSync.clientId, []);
        }

        const paymentData = {
          id: receivable.idReceivable,
          amount: receivable.amount,
          dueDate: receivable.dueDate,
          paymentDate: receivable.paymentDate,
          status: receivable.status,
          description: receivable.description,
        };

        clientPaymentMap.get(evoSync.clientId)!.push(paymentData);
        result.processed++;

        if (receivable.status?.toLowerCase() === "paid") {
          result.paidAmount += receivable.amount || 0;
        } else {
          result.pendingAmount += receivable.amount || 0;
        }
        result.totalAmount += receivable.amount || 0;
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Receivable ${receivable.idReceivable}: ${errorMsg}`);
        console.error(`[EVO_SYNC_PAYMENTS] Failed to process receivable ${receivable.idReceivable}:`, error);
      }
    }

    for (const [clientId, payments] of clientPaymentMap.entries()) {
      try {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });

        if (!client) {
          continue;
        }

        const paymentNotes = JSON.stringify({
          source: "evo_sync",
          payments: payments,
          syncedAt: new Date().toISOString(),
        });

        await prisma.client.update({
          where: { id: clientId },
          data: {
            notes: client.notes
              ? `${client.notes}\n\n[EVO Payments]\n${paymentNotes}`
              : `[EVO Payments]\n${paymentNotes}`,
          },
        });
      } catch (error) {
        console.error(`[EVO_SYNC_PAYMENTS] Failed to update client ${clientId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payments sync completed: ${result.processed} processed, ${result.failed} failed. Total: $${result.totalAmount.toFixed(2)}, Paid: $${result.paidAmount.toFixed(2)}, Pending: $${result.pendingAmount.toFixed(2)}`,
      result,
    });
  } catch (error) {
    console.error("[EVO_SYNC_PAYMENTS] Sync error:", error);
    return NextResponse.json(
      {
        detail: "Payments sync failed",
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
  const status = searchParams.get("status");

  const prisma = (await import("@/lib/db")).default;

  const evoSettings = await prisma.evoSettings.findFirst();
  if (!evoSettings || !evoSettings.isEnabled) {
    return NextResponse.json(
      { detail: "EVO integration not configured or disabled" },
      { status: 400 }
    );
  }

  const clients = await prisma.client.findMany({
    where: {
      notes: { contains: "[EVO Payments]" },
    },
    select: {
      id: true,
      name: true,
      email: true,
      notes: true,
    },
  });

  const paymentSummaries = clients
    .map((client) => {
      try {
        const evoPaymentsMatch = client.notes?.match(/\[EVO Payments]\n([\s\S]*?})/);
        if (!evoPaymentsMatch) return null;

        const paymentData = JSON.parse(evoPaymentsMatch[1]);
        if (paymentData.source !== "evo_sync") return null;

        const payments = paymentData.payments || [];
        const filtered = status
          ? payments.filter((p: any) => p.status?.toLowerCase() === status.toLowerCase())
          : payments;

        return {
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          paymentCount: filtered.length,
          totalAmount: filtered.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
          paidAmount: filtered
            .filter((p: any) => p.status?.toLowerCase() === "paid")
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
          pendingAmount: filtered
            .filter((p: any) => p.status?.toLowerCase() !== "paid")
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
          lastSync: paymentData.syncedAt,
        };
      } catch {
        return null;
      }
    })
    .filter((summary): summary is NonNullable<typeof summary> => summary !== null);

  const totals = paymentSummaries.reduce(
    (acc, summary) => ({
      totalAmount: acc.totalAmount + summary.totalAmount,
      paidAmount: acc.paidAmount + summary.paidAmount,
      pendingAmount: acc.pendingAmount + summary.pendingAmount,
      clientCount: acc.clientCount + 1,
    }),
    { totalAmount: 0, paidAmount: 0, pendingAmount: 0, clientCount: 0 }
  );

  return NextResponse.json({
    configured: true,
    enabled: evoSettings.isEnabled,
    summaries: paymentSummaries,
    totals: {
      ...totals,
      totalAmount: parseFloat(totals.totalAmount.toFixed(2)),
      paidAmount: parseFloat(totals.paidAmount.toFixed(2)),
      pendingAmount: parseFloat(totals.pendingAmount.toFixed(2)),
    },
  });
}
