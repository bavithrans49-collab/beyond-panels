import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let comics: any[] = [];
  try {
    comics = await prisma.comic.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch (e: any) {
    console.error("Homepage DB error:", e);
    return (
      <div className="max-w-xl mx-auto py-20 px-4">
        <div className="bg-red-50 border border-red-300 rounded p-6">
          <h2 className="text-red-800 font-bold mb-2">Database Error</h2>
          <p className="text-red-700 text-sm font-mono break-all">{e.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative halftone-bg border-b-4 border-ink-black overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(211, 47, 47, 0.03) 40px, rgba(211, 47, 47, 0.03) 80px)"
        }} />
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <div className="text-center">
            <div className="inline-block comic-badge px-6 py-2 mb-6 text-lg font-bold">
              NEW & EXCLUSIVE
            </div>
            <h1 className="font-heading text-6xl md:text-8xl font-black text-heroic-blue mb-4">
              BEYOND
              <br />
              PANELS
            </h1>
            <p className="font-heading text-xl md:text-2xl text-heroic-blue/80 italic mb-8">
              Classic Comics. Modern Store.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/catalog"
                className="bg-comic-red text-white font-bold px-8 py-3 rounded text-lg hover:bg-red-700 transition comic-panel"
              >
                LATEST RELEASE
              </Link>
              <Link
                href="/catalog"
                className="bg-heroic-blue text-white font-bold px-8 py-3 rounded text-lg hover:bg-blue-800 transition comic-panel"
              >
                BROWSE ALL
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-1 flex-1 bg-comic-red" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-heroic-blue text-center whitespace-nowrap">
            LATEST COMICS
          </h2>
          <div className="h-1 flex-1 bg-comic-red" />
        </div>

        {comics.length === 0 ? (
          <div className="text-center py-16">
            <div className="speech-bubble inline-block px-8 py-4 text-lg font-heading">
              No comics yet — stay tuned!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                      <span className="font-heading text-4xl text-heroic-blue/30 font-bold">
                        {comic.title[0]}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-xl font-bold mb-1">{comic.title}</h3>
                    {comic.series && (
                      <p className="text-sm text-gray-500 mb-2">
                        {comic.series} {comic.issueNumber ? `#${comic.issueNumber}` : ""}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-2xl font-bold text-comic-red">
                        ₹{comic.price}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-heroic-blue py-16 border-t-4 border-golden-yellow">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="speech-bubble p-8 mb-8 inline-block">
            <p className="font-heading text-xl text-heroic-blue">
              &ldquo;Every panel tells a story. Start yours today.&rdquo;
            </p>
          </div>
          <Link
            href="/catalog"
            className="inline-block bg-golden-yellow text-ink-black font-bold px-10 py-4 rounded text-xl comic-panel hover:bg-yellow-400 transition"
          >
            EXPLORE THE COLLECTION
          </Link>
        </div>
      </section>
    </div>
  );
}
