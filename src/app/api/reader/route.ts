import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).isAdmin;
  const { searchParams } = new URL(req.url);
  const comicId = searchParams.get("comicId");
  const preview = searchParams.get("preview") === "true";

  if (!comicId) return NextResponse.json({ error: "comicId required" }, { status: 400 });

  const comic = await prisma.comic.findUnique({
    where: { id: comicId },
    include: { pages: { orderBy: { pageNumber: "asc" } } },
  });

  if (!comic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!preview && !isAdmin) {
    const purchase = await prisma.purchase.findFirst({
      where: { userId, comicId, status: "confirmed" },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Not purchased" }, { status: 403 });
    }
  }

  const pages = preview
    ? comic.pages.slice(0, comic.previewPages)
    : comic.pages;

  return NextResponse.json({
    id: comic.id,
    title: comic.title,
    pdfFile: comic.pdfFile,
    preview: preview,
    previewPages: comic.previewPages,
    pages: pages.map((p) => ({ id: p.id, pageNumber: p.pageNumber, imageUrl: p.imageUrl })),
  });
}
