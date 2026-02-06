import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where = unreadOnly ? { isRead: false } : {};

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { isRead: false },
  });

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    hasMore: offset + notifications.length < total,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, priority, title, message, actionUrl, metadata } = body;

  const notification = await prisma.notification.create({
    data: {
      type,
      priority,
      title,
      message,
      actionUrl,
      metadata,
      userId: session.user.id,
    },
  });

  return NextResponse.json(notification, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ids, markAsRead } = body;

  if (markAsRead && Array.isArray(ids)) {
    await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
