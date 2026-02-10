import { NextResponse } from "next/server";
import { requireUser } from "@/lib/token-auth";
import { createEvoClient, EvoMember } from "@/lib/evo-api";

function getInitials(firstName?: string, lastName?: string): string {
  const initials = [];
  if (firstName && firstName.length > 0) {
    initials.push(firstName[0]);
  }
  if (lastName && lastName.length > 0) {
    initials.push(lastName[0]);
  }
  return initials.join("").toUpperCase();
}

function mapEvoStatus(status?: string): string {
  if (!status) return "Pending";
  const normalized = status.toLowerCase();
  if (normalized === "ativo" || normalized === "active" || normalized === "activo") {
    return "Active";
  }
  if (normalized === "inativo" || normalized === "inactive" || normalized === "inactivo") {
    return "Inactive";
  }
  return "Pending";
}

function extractEmail(contacts?: any[]): string {
  if (!contacts || !Array.isArray(contacts)) return "";
  const emailContact = contacts.find(c => c.contactType === "E-mail");
  return emailContact?.description || "";
}

function extractPhone(contacts?: any[]): string {
  if (!contacts || !Array.isArray(contacts)) return "";
  const phoneContact = contacts.find(c => c.contactType === "Cellphone" || c.contactType === "Phone");
  return phoneContact?.description || "";
}

function extractPlan(memberships?: any[]): string {
  if (!memberships || !Array.isArray(memberships) || memberships.length === 0) return "";
  const activeMembership = memberships.find(m => m.membershipStatus === "active");
  return activeMembership?.name || memberships[0]?.name || "";
}

export async function GET(request: Request) {
  const currentUser = await requireUser(request.headers.get("authorization"));
  if (!currentUser) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const dns = process.env.EVO_DNS;
  const token = process.env.EVO_TOKEN;
  const username = process.env.EVO_USERNAME;

  if (!dns || !token) {
    console.error("[EVO_FETCH] Missing environment variables: EVO_DNS or EVO_TOKEN");
    return NextResponse.json(
      { error: "Evo API configuration missing" },
      { status: 500 }
    );
  }

  try {
    const evoClient = createEvoClient({
      dns,
      apiKey: token,
      username,
    });

    console.log("[EVO_FETCH] Fetching members from Evo API using env variables...");
    console.log(`[EVO_FETCH] DNS: ${dns}`);
    
    const members = await evoClient.getActiveMembers();

    if (!members || members.length === 0) {
      console.log("[EVO_FETCH] No members found - API returned empty or 404");
      return NextResponse.json({
        success: true,
        message: "No members found",
        memberCount: 0,
        members: []
      });
    }

    console.log(`[EVO_FETCH] Successfully fetched ${members.length} members`);

    const clients = members.map((member: EvoMember) => {
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
      const plan = extractPlan(member.memberships);
      return {
        id: member.idMember,
        name: fullName || "Sin nombre",
        email: extractEmail(member.contacts),
        phone: extractPhone(member.contacts),
        status: mapEvoStatus(member.membershipStatus || member.status),
        plan: plan,
        avatar: member.photoUrl || getInitials(member.firstName, member.lastName),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${members.length} members`,
      memberCount: members.length,
      members: clients
    });
  } catch (error) {
    console.error("[EVO_FETCH] Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members from Evo API" },
      { status: 500 }
    );
  }
}