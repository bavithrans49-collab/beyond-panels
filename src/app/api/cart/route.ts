import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const userId = (session.user as any).id;
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { comic: { select: { id: true, title: true, coverImage: true, price: true } } },
  });

  return NextResponse.json(
    items.map((item) => ({
      id: item.id,
      comicId: item.comic.id,
      title: item.comic.title,
      coverImage: item.comic.coverImage,
      price: item.comic.price,
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { comicId } = await req.json();

  const existing = await prisma.cartItem.findFirst({
    where: { userId, comicId },
  });

  if (!existing) {
    await prisma.cartItem.create({
      data: { userId, comicId },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const comicId = searchParams.get("comicId");

  if (comicId) {
    await prisma.cartItem.deleteMany({
      where: { userId, comicId },
    });
  } else {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  return NextResponse.json({ success: true });
}
