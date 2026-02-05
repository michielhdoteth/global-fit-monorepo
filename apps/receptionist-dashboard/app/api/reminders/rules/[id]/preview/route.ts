import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/token-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function personalizeMessage(template: string, client: { name: string; plan?: string | null }) {
  return template
    .replaceAll("{nombre}", client.name)
    .replaceAll("{plan}", client.plan || "")
    .replaceAll("{membership_expiry}", "");
}

async function fetchTargetClients(ruleId: number) {
  const rule = await prisma.reminderRule.findUnique({
    where: { id: ruleId },
    include: { targets: true },
  });
  if (!rule) return { rule: null, clients: [] };

  const targets = rule.targets;
  if (targets.length === 0) {
    const clients = await prisma.client.findMany();
    return { rule, clients };
  }

  const filters = targets.map((target: typeof targets[0]) => {
    if (target.targetType === "all_clients") return {};
    if (target.targetType === "specific_plan") {
      return { plan: target.targetValue || undefined };
    }
    if (target.targetType === "specific_status") {
      return {
        status: target.targetValue
          ? (target.targetValue.toUpperCase() as any)
          : undefined,
      };
    }
    return {};
  });

  const clients = await prisma.client.findMany({
    where: filters.length > 0 ? { OR: filters } : {},
  });
  return { rule, clients };
}

export async function GET(request: Request, { params }: RouteParams) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ruleId = Number(id);
  const { rule, clients } = await fetchTargetClients(ruleId);
  if (!rule) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const sample = clients.slice(0, 3).map((client: typeof clients[0]) => ({
    client: client.name,
    phone: client.phone || "",
    message: personalizeMessage(rule.templateMessage, client),
  }));

  return NextResponse.json({
    rule_id: rule.id,
    rule_name: rule.name,
    rule_type: rule.ruleType,
    total_affected_clients: clients.length,
    sample_messages: sample,
  });
}
