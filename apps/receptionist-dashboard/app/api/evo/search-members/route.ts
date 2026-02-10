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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("name");

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const dns = process.env.EVO_DNS;
    const token = process.env.EVO_TOKEN;
    const username = process.env.EVO_USERNAME;

    if (!dns || !token) {
      console.error("[EVO_SEARCH] Missing environment variables: EVO_DNS or EVO_TOKEN");
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

    console.log(`[EVO_SEARCH] Searching members with query: "${query}"`);
    
    const members = await evoClient.searchMembers(query);

    if (!members || members.length === 0) {
      console.log("[EVO_SEARCH] No members found");
      return NextResponse.json([]);
    }

    console.log(`[EVO_SEARCH] Found ${members.length} members`);

    const clients = members.map((member: EvoMember) => {
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
      return {
        id: member.idMember,
        name: fullName || "Sin nombre",
        email: extractEmail(member.contacts),
        phone: extractPhone(member.contacts),
        photoUrl: member.photoUrl,
        initials: getInitials(member.firstName, member.lastName),
      };
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("[EVO_SEARCH] Error searching members:", error);
    return NextResponse.json(
      { error: "Failed to search members" },
      { status: 500 }
    );
  }
}
