import { NextResponse } from "next/server";
import prisma from "@/lib/db";

async function getOrCreateBackupSettings() {
  const existing = await prisma.backupSettings.findFirst();
  if (existing) return existing;

  return prisma.backupSettings.create({
    data: {
      isEnabled: false,
      frequency: "daily",
      backupTime: "02:00",
      retentionDays: 30,
    },
  });
}

export async function GET() {
  try {
    const settings = await getOrCreateBackupSettings();
    return NextResponse.json({
      id: settings.id,
      isEnabled: settings.isEnabled,
      frequency: settings.frequency,
      backupTime: settings.backupTime,
      retentionDays: settings.retentionDays,
      lastBackupAt: settings.lastBackupAt,
      nextScheduledAt: settings.nextScheduledAt,
    });
  } catch (error) {
    console.error("Error fetching backup settings:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch settings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      isEnabled,
      frequency = "daily",
      backupTime = "02:00",
      retentionDays = 30,
    } = body;

    const settings = await getOrCreateBackupSettings();

    const data: any = {};
    if (isEnabled !== undefined) data.isEnabled = Boolean(isEnabled);
    if (frequency) data.frequency = String(frequency);
    if (backupTime) data.backupTime = String(backupTime);
    if (retentionDays) data.retentionDays = Number(retentionDays);

    if (isEnabled && !settings.nextScheduledAt) {
      const nextBackup = calculateNextBackupTime(frequency, backupTime);
      data.nextScheduledAt = nextBackup;
    }

    const updated = await prisma.backupSettings.update({
      where: { id: settings.id },
      data,
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      isEnabled: updated.isEnabled,
      frequency: updated.frequency,
      backupTime: updated.backupTime,
      retentionDays: updated.retentionDays,
      lastBackupAt: updated.lastBackupAt,
      nextScheduledAt: updated.nextScheduledAt,
    });
  } catch (error) {
    console.error("Error updating backup settings:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update settings",
      },
      { status: 500 }
    );
  }
}

function calculateNextBackupTime(frequency: string, backupTime: string): Date {
  const now = new Date();
  const [hours, minutes] = backupTime.split(":").map((n: string) => Number(n));

  let nextBackup = new Date();
  nextBackup.setHours(hours, minutes, 0, 0);

  if (nextBackup <= now) {
    if (frequency === "daily") {
      nextBackup.setDate(nextBackup.getDate() + 1);
    } else if (frequency === "weekly") {
      nextBackup.setDate(nextBackup.getDate() + 7);
    } else if (frequency === "monthly") {
      nextBackup.setMonth(nextBackup.getMonth() + 1);
    }
  }

  return nextBackup;
}
