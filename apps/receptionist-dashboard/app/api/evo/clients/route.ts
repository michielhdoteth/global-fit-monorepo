import { NextResponse } from "next/server";
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
  // Find the active membership or the first one
  const activeMembership = memberships.find(m => m.membershipStatus === "active");
  return activeMembership?.name || memberships[0]?.name || "";
}

export async function GET(request: Request) {
  try {
    const dns = process.env.EVO_DNS;
    const token = process.env.EVO_TOKEN;
    const username = process.env.EVO_USERNAME;

    if (!dns || !token) {
      console.error("[EVO_CLIENTS] Missing environment variables: EVO_DNS or EVO_TOKEN");
      return NextResponse.json(
        { error: "Evo API configuration missing" },
        { status: 500 }
      );
    }

    const evoClient = createEvoClient({
      dns,
      apiKey: token,
      username,
    });

    console.log("[EVO_CLIENTS] Fetching members from Evo API...");
    
    // Obtener todos los miembros activos de Evo que incluyen membresías
    const members = await evoClient.getActiveMembers();

    if (!members || members.length === 0) {
      console.log("[EVO_CLIENTS] No members found in Evo");
      return NextResponse.json([]);
    }

    console.log(`[EVO_CLIENTS] Found ${members.length} members in Evo`);
    console.log("[EVO_CLIENTS] Sample member:", JSON.stringify(members[0], null, 2));

    // Transformar los datos de Evo al formato del CRM
    const clients = members.map((member: EvoMember) => {
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
      const plan = extractPlan(member.memberships);
      console.log(`[EVO_CLIENTS] Member ${fullName} plan:`, plan);
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

    return NextResponse.json(clients);
  } catch (error) {
    console.error("[EVO_CLIENTS] Error fetching clients from Evo:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients from Evo API" },
      { status: 500 }
    );
  }
}
