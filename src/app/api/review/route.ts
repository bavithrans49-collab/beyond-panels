import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { comicId, rating, comment } = await req.json();

  if (!comicId || !rating || !comment) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const purchased = await prisma.purchase.findFirst({
    where: { userId, comicId, status: "confirmed" },
  });

  if (!purchased) {
    return NextResponse.json(
      { error: "Only purchasers can review" },
      { status: 403 }
    );
  }

  const review = await prisma.review.create({
    data: { userId, comicId, rating, comment },
  });

  return NextResponse.json({ success: true, review });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const comicId = searchParams.get("comicId");

  if (!comicId) return NextResponse.json({ error: "comicId required" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { comicId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}
