import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const filename = String(body.file_name || "").trim();
  const fileType = body.file_type ? String(body.file_type).trim() : null;

  if (!filename) {
    return NextResponse.json({ detail: "Filename is required" }, { status: 400 });
  }

  const doc = await prisma.knowledgeDocument.create({
    data: {
      filename,
      fileType,
      isIndexed: false,
    },
  });

  return NextResponse.json({
    id: doc.id,
    filename: doc.filename,
    file_type: doc.fileType,
    is_indexed: doc.isIndexed,
    uploaded_at: doc.uploadedAt,
  });
}
