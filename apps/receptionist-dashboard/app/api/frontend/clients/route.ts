import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getInitials, mapClientStatus, createApiError } from "@/lib/utils";
import { verifyAuthToken, getBearerToken } from "@/lib/token-auth";

function checkAuth(request: Request) {
  const token = getBearerToken(request.headers.get("authorization"));
  return token && verifyAuthToken(token);
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        status: mapClientStatus(client.status),
        plan: client.plan || "",
        avatar: getInitials(client.name),
      }))
    );
  } catch (error) {
    console.error("[CLIENTS] Error fetching clients:", error);
    return NextResponse.json(createApiError("Failed to fetch clients", 500), { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, plan } = body;

    if (!name || !email) {
      return NextResponse.json(createApiError("Name and email are required", 400), { status: 400 });
    }

    const client = await prisma.client.create({
      data: { name, email, phone: phone || null, plan: plan || null, status: "PENDING" },
    });

    return NextResponse.json({
      id: client.id, name: client.name, email: client.email,
      phone: client.phone || "", status: mapClientStatus(client.status),
      plan: client.plan || "", avatar: getInitials(client.name),
    });
  } catch (error) {
    console.error("[CLIENTS] Error creating client:", error);
    return NextResponse.json(createApiError("Failed to create client", 500), { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, email, phone, plan, status } = body;

    if (!id) {
      return NextResponse.json(createApiError("ID is required", 400), { status: 400 });
    }

    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: {
        name,
        email,
        phone: phone || null,
        plan: plan || null,
        status: status || undefined,
      },
    });

    return NextResponse.json({
      id: client.id, name: client.name, email: client.email,
      phone: client.phone || "", status: mapClientStatus(client.status),
      plan: client.plan || "", avatar: getInitials(client.name),
    });
  } catch (error) {
    console.error("[CLIENTS] Error updating client:", error);
    return NextResponse.json(createApiError("Failed to update client", 500), { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(createApiError("ID is required", 400), { status: 400 });
    }

    await prisma.client.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ status: "Deleted" });
  } catch (error) {
    console.error("[CLIENTS] Error deleting client:", error);
    return NextResponse.json(createApiError("Failed to delete client", 500), { status: 500 });
  }
}
