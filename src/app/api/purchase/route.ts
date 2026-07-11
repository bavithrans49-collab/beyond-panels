import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { comicIds, buyerName, total } = await req.json();

  if (!comicIds || comicIds.length === 0 || !buyerName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const purchases = await Promise.all(
    comicIds.map((comicId: string) =>
      prisma.purchase.create({
        data: {
          userId,
          comicId,
          buyerName,
          amount: total,
          status: "pending",
        },
      })
    )
  );

  await prisma.cartItem.deleteMany({
    where: { userId, comicId: { in: comicIds } },
  });

  return NextResponse.json({ success: true, purchases });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: "Purchase ID required" }, { status: 400 });

  const purchase = await prisma.purchase.findUnique({ where: { id } });
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (purchase.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.purchase.update({
    where: { id },
    data: { status: "confirmed" },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const purchaseId = searchParams.get("id");

  if (!purchaseId) return NextResponse.json({ error: "Purchase ID required" }, { status: 400 });

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (purchase.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.purchase.delete({ where: { id: purchaseId } });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.isAdmin) {
    const purchases = await prisma.purchase.findMany({
      include: {
        user: { select: { name: true, email: true } },
        comic: { select: { id: true, title: true, coverImage: true, pages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(purchases);
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    include: {
      comic: { select: { id: true, title: true, coverImage: true, pages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(purchases);
}
