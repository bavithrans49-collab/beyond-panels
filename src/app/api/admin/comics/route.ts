import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comics = await prisma.comic.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { purchases: true, pages: true } },
    },
  });

  return NextResponse.json(comics);
}
