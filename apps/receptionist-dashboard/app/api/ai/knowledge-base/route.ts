import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const docs = await prisma.knowledgeDocument.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json(
    docs.map((doc: typeof docs[0]) => ({
      id: doc.id,
      filename: doc.filename,
      file_type: doc.fileType,
      is_indexed: doc.isIndexed,
      uploaded_at: doc.uploadedAt,
    }))
  );
}
