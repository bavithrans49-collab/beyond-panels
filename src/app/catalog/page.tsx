import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const comics = await prisma.comic.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl md:text-5xl font-bold text-heroic-blue mb-2">
        CATALOG
      </h1>
      <div className="action-line mb-8 h-4" />

      {comics.length === 0 ? (
        <div className="text-center py-20">
          <div className="speech-bubble inline-block px-8 py-4 text-xl font-heading">
            Nothing here yet. Check back soon!
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {comics.map((comic) => (
            <Link key={comic.id} href={`/comic/${comic.id}`} className="group">
              <div className="comic-panel bg-white overflow-hidden transition-transform hover:-translate-y-1">
                <div className="aspect-[3/4] bg-heroic-blue/10 flex items-center justify-center overflow-hidden">
                  {comic.coverImage ? (
                    <img
                      src={comic.coverImage}
                      alt={comic.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-heading text-5xl text-heroic-blue/20 font-bold">
                      {comic.title[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-lg font-bold">{comic.title}</h3>
                  {comic.series && (
                    <p className="text-sm text-gray-500">
                      {comic.series} {comic.issueNumber ? `#${comic.issueNumber}` : ""}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{comic.description}</p>
                  <span className="font-heading text-xl font-bold text-comic-red mt-2 block">
                    ₹{comic.price}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
