"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LibraryComic {
  id: string;
  title: string;
  coverImage: string;
  pages: { id: string }[];
}

interface Purchase {
  id: string;
  comic: LibraryComic | null;
  status: string;
  createdAt: string;
}

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch(`/api/purchase?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setPurchases(data))
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleDelete = async (purchaseId: string) => {
    await fetch(`/api/purchase?id=${purchaseId}`, { method: "DELETE" });
    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="font-heading text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl font-bold text-heroic-blue mb-2">YOUR LIBRARY</h1>
      <div className="action-line mb-8 h-4" />

      {purchases.length === 0 ? (
        <div className="text-center py-20">
          <div className="speech-bubble inline-block px-8 py-4 text-xl font-heading">
            Your library is empty. Buy a comic to get started!
          </div>
          <div className="mt-6">
            <Link
              href="/catalog"
              className="bg-heroic-blue text-white font-bold px-8 py-3 rounded comic-panel hover:bg-blue-800 transition"
            >
              BROWSE COMICS
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => {
            if (!purchase.comic) {
              return (
                <div key={purchase.id} className="comic-panel bg-white overflow-hidden relative">
                  <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                    <span className="font-heading text-lg text-gray-400">Comic unavailable</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-lg font-bold text-gray-400">Deleted Comic</h3>
                    <div className="bg-gray-200 text-gray-500 text-center py-2 rounded mt-3 font-bold text-sm">
                      This comic has been removed
                    </div>
                    <button
                      onClick={() => setConfirmDelete(purchase.id)}
                      className="w-full text-gray-400 text-xs text-center py-1 mt-1 hover:text-comic-red transition"
                    >
                      Remove from library
                    </button>
                  </div>
                </div>
              );
            }
            const c = purchase.comic;
            return (
              <div key={purchase.id} className="comic-panel bg-white overflow-hidden relative">
                <div className="aspect-[3/4] bg-heroic-blue/10 flex items-center justify-center">
                  {c.coverImage ? (
                    <img
                      src={c.coverImage}
                      alt={c.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-heading text-4xl text-heroic-blue/20 font-bold">
                      {c.title[0]}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-lg font-bold">{c.title}</h3>
                  {purchase.status === "confirmed" ? (
                    <button
                      onClick={() => router.push(`/reader/${c.id}`)}
                      className="block w-full bg-comic-red text-white font-bold text-center py-2 rounded mt-3 hover:bg-red-700 transition cursor-pointer"
                    >
                      READ NOW
                    </button>
                  ) : (
                    <div className="bg-golden-yellow/50 text-ink-black text-center py-2 rounded mt-3 font-bold text-sm">
                      ⏳ PENDING — Awaiting confirmation
                    </div>
                  )}
                  <button
                    onClick={() => setConfirmDelete(purchase.id)}
                    className="w-full text-gray-400 text-xs text-center py-1 mt-1 hover:text-comic-red transition"
                  >
                    Remove from library
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="comic-panel bg-white p-8 w-full max-w-sm relative text-center">
            <h2 className="font-heading text-2xl font-bold text-heroic-blue mb-4">
              REMOVE COMIC?
            </h2>
            <p className="text-gray-600 mb-6">
              This will remove the comic from your library. You can purchase it again later if you change your mind.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded hover:bg-gray-300 transition"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 bg-comic-red text-white font-bold py-2 rounded hover:bg-red-700 transition"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
