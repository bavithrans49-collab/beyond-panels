import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    if (!title || !price) {
      return NextResponse.json({ error: "Title and price required" }, { status: 400 });
    }

    const comicId = uuidv4();

    let coverImage = "";

    if (coverFile) {
      const ext = coverFile.name.split(".").pop() || "jpg";
      const filename = `cover.${ext}`;
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      coverImage = await uploadToR2(comicId, filename, buffer, coverFile.type || `image/${ext}`);
    }

    let pdfUrl = null;

    if (pdfFile && pdfFile.size > 0) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      pdfUrl = await uploadToR2(comicId, "comic.pdf", buffer, "application/pdf");
    }

    const pages: { pageNumber: number; imageUrl: string }[] = [];

    if (!pdfUrl) {
      for (let i = 0; i < pageFiles.length; i++) {
        const file = pageFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `pages/page-${String(i + 1).padStart(3, "0")}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadToR2(comicId, filename, buffer, file.type || `image/${ext}`);
        pages.push({
          pageNumber: i + 1,
          imageUrl: url,
        });
      }
    }

    await prisma.comic.create({
      data: {
        id: comicId,
        title,
        description,
        series,
        issueNumber,
        price,
        coverImage,
        previewPages,
        pdfFile: pdfUrl,
        ...(pages.length > 0 ? { pages: { create: pages } } : {}),
      },
    });

    return NextResponse.json({ success: true, id: comicId });
  } catch (error) {
    console.error("Create comic error:", error);
    return NextResponse.json({ error: "Failed to create comic" }, { status: 500 });
  }
}
