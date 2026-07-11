import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const storageUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/${process.env.SUPABASE_STORAGE_BUCKET || "beyond-panels"}/${pdfKey}`;

    const res = await fetch(storageUrl, {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!res.ok) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
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
