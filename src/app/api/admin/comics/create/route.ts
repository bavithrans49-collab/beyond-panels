import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { comicId, title, description, series, issueNumber, price, previewPages, coverImage, pdfFile, pages } = body;

    if (!title || !price) {
      return NextResponse.json({ error: "Title and price required" }, { status: 400 });
    }

    await prisma.comic.create({
      data: {
        id: comicId,
        title,
        description: description || "",
        series: series || null,
        issueNumber: issueNumber ? Number(issueNumber) : null,
        price: Number(price),
        coverImage: coverImage || "",
        previewPages: Number(previewPages) || 3,
        pdfFile: pdfFile || null,
        ...(pages && pages.length > 0 ? { pages: { create: pages } } : {}),
      },
    });

    return NextResponse.json({ success: true, id: comicId });
  } catch (error: any) {
    console.error("Create comic error:", error);
    return NextResponse.json({ error: error.message || "Failed to create comic" }, { status: 500 });
  }
}
