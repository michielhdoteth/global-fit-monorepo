import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row: typeof data[0]) =>
    headers
      .map((header: string) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return `"${JSON.stringify(value)}"`;
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      })
      .join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

interface ExportData {
  clients?: any[];
  appointments?: any[];
  campaigns?: any[];
  reminders?: any[];
  conversations?: any[];
  leads?: any[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { format = "json", dataTypes = ["clients", "appointments"] } = body;

    const exportData: ExportData = {};

    if (dataTypes.includes("clients")) {
      exportData.clients = await prisma.client.findMany({
        include: {
          leads: true,
          appointments: true,
        },
      });
    }

    if (dataTypes.includes("appointments")) {
      exportData.appointments = await prisma.appointment.findMany({
        include: {
          client: true,
          reminders: true,
        },
      });
    }

    if (dataTypes.includes("campaigns")) {
      exportData.campaigns = await prisma.campaign.findMany({
        include: {
          client: true,
        },
      });
    }

    if (dataTypes.includes("reminders")) {
      exportData.reminders = await prisma.reminder.findMany({
        include: {
          client: true,
          appointment: true,
        },
      });
    }

    if (dataTypes.includes("conversations")) {
      exportData.conversations = await prisma.conversation.findMany({
        include: {
          client: true,
          messages: true,
        },
      });
    }

    if (dataTypes.includes("leads")) {
      exportData.leads = await prisma.lead.findMany({
        include: {
          client: true,
        },
      });
    }

    let fileContent: string;
    let fileType: string;
    let filename: string;

    if (format === "csv") {
      const timestamp = new Date().toISOString().split("T")[0];
      const csvParts: string[] = [];

      for (const [key, value] of Object.entries(exportData)) {
        if (value && Array.isArray(value) && value.length > 0) {
          csvParts.push(`\n\n=== ${key.toUpperCase()} ===\n`);
          csvParts.push(convertToCSV(value));
        }
      }

      fileContent = csvParts.join("\n");
      fileType = "text/csv";
      filename = `global-fit-export-${timestamp}.csv`;
    } else {
      fileContent = JSON.stringify(exportData, null, 2);
      fileType = "application/json";
      filename = `global-fit-export-${Date.now()}.json`;
    }

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": fileType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to export data",
      },
      { status: 500 }
    );
  }
}
