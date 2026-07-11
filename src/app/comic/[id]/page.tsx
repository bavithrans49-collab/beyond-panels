import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ComicDetailClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ComicDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const comic = await prisma.comic.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { pageNumber: "asc" } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!comic) notFound();

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  let isOwned = false;
  if (userId) {
    const purchase = await prisma.purchase.findFirst({
      where: { userId, comicId: id, status: "confirmed" },
    });
    isOwned = !!purchase;
  }

  const previewPages = comic.pages.slice(0, comic.previewPages);

  return <ComicDetailClient comic={comic} previewPages={previewPages} isOwned={isOwned} />;
}
