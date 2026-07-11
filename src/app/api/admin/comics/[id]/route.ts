import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, deleteKeysFromR2 } from "@/lib/r2";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comic = await prisma.comic.findUnique({
    where: { id },
    include: { pages: { orderBy: { pageNumber: "asc" } } },
  });

  if (!comic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(comic);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const series = (formData.get("series") as string) || null;
    const issueNumber = formData.get("issueNumber") ? Number(formData.get("issueNumber")) : null;
    const price = Number(formData.get("price"));
    const previewPages = Number(formData.get("previewPages")) || 3;
    const coverFile = formData.get("cover") as File | null;
    const pageFiles = formData.getAll("pages") as File[];
    const pdfFile = formData.get("pdf") as File | null;

    const updateData: any = {
      title,
      description,
      series,
      issueNumber,
      price,
      previewPages,
    };

    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() || "jpg";
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      updateData.coverImage = await uploadToR2(id, `cover.${ext}`, buffer, coverFile.type || `image/${ext}`);
    }

    if (pdfFile && pdfFile.size > 0) {
      const oldPages = await prisma.comicPage.findMany({ where: { comicId: id } });
      const oldKeys = oldPages.map((p) => {
        try { const u = new URL(p.imageUrl); const k = u.pathname.replace(/^\//, ""); if (k.startsWith(id + "/")) return k; } catch {}
        return "";
      }).filter(Boolean);
      if (oldKeys.length > 0) await deleteKeysFromR2(oldKeys);
      await prisma.comicPage.deleteMany({ where: { comicId: id } });

      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      updateData.pdfFile = await uploadToR2(id, "comic.pdf", buffer, "application/pdf");
    }

    if (!updateData.pdfFile && pageFiles.length > 0) {
      const oldPages = await prisma.comicPage.findMany({ where: { comicId: id } });
      const oldKeys = oldPages.map((p) => {
        const u = new URL(p.imageUrl);
        const key = u.pathname.replace(/^\//, "");
        if (key.startsWith(id + "/")) return key;
        return "";
      }).filter(Boolean);
      if (oldKeys.length > 0) await deleteKeysFromR2(oldKeys);
      await prisma.comicPage.deleteMany({ where: { comicId: id } });

      for (let i = 0; i < pageFiles.length; i++) {
        const file = pageFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `pages/page-${String(i + 1).padStart(3, "0")}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadToR2(id, filename, buffer, file.type || `image/${ext}`);
        await prisma.comicPage.create({
          data: { comicId: id, pageNumber: i + 1, imageUrl: url },
        });
      }
    }

    await prisma.comic.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update comic error:", error);
    return NextResponse.json({ error: "Failed to update comic" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comic = await prisma.comic.findUnique({ where: { id } });

  try {
    const keys: string[] = [];

    if (comic?.pdfFile) {
      try { const u = new URL(comic.pdfFile); keys.push(u.pathname.replace(/^\//, "")); } catch {}
    }

    if (comic?.coverImage) {
      try { const u = new URL(comic.coverImage); keys.push(u.pathname.replace(/^\//, "")); } catch {}
    }

    const pages = await prisma.comicPage.findMany({ where: { comicId: id } });
    pages.forEach((p) => {
      try { const u = new URL(p.imageUrl); keys.push(u.pathname.replace(/^\//, "")); } catch {}
    });

    await deleteKeysFromR2(keys);

    await prisma.purchase.deleteMany({ where: { comicId: id } });
    await prisma.comicPage.deleteMany({ where: { comicId: id } });
    await prisma.review.deleteMany({ where: { comicId: id } });
    await prisma.cartItem.deleteMany({ where: { comicId: id } });
    await prisma.comic.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comic error:", error);
    return NextResponse.json({ error: "Failed to delete comic" }, { status: 500 });
  }
}
