import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "beyond-panels";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).isAdmin;
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const preview = searchParams.get("preview") === "true";

  const comic = await prisma.comic.findUnique({ where: { id } });
  if (!comic || !comic.pdfFile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAdmin && !preview) {
    const purchase = await prisma.purchase.findFirst({
      where: { userId, comicId: id, status: "confirmed" },
    });
    if (!purchase) return NextResponse.json({ error: "Not purchased" }, { status: 403 });
  }

  try {
    const pdfKey = `${id}/comic.pdf`;
    const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: pdfKey });
    const response = await r2Client.send(command);
    const body = await response.Body?.transformToByteArray();

    if (!body) return NextResponse.json({ error: "File not found" }, { status: 404 });

    return new Response(Buffer.from(body), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
