"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Purchase {
  id: string;
  comic: { title: string };
  buyerName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/purchase")
      .then((res) => res.json())
      .then((data) => setPurchases(data))
      .finally(() => setLoading(false));
  }, [status, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="font-heading text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl font-bold text-heroic-blue mb-2">MY ACCOUNT</h1>
      <div className="action-line mb-8 h-4" />

      <div className="comic-panel bg-white p-6 mb-8">
        <h2 className="font-heading text-xl font-bold mb-2">Profile</h2>
        <p className="text-gray-600">
          Name: <span className="font-bold">{(session?.user as any)?.name}</span>
        </p>
        <p className="text-gray-600">
          Email: <span className="font-bold">{session?.user?.email}</span>
        </p>
      </div>

      <h2 className="font-heading text-2xl font-bold mb-4">Purchase History</h2>
      {purchases.length === 0 ? (
        <p className="text-gray-500 font-heading">No purchases yet.</p>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <div key={p.id} className="comic-panel bg-white p-4 flex items-center justify-between">
              <div>
                <span className="font-bold">{p.comic.title}</span>
                <span className="text-sm text-gray-500 ml-2">
                  as &ldquo;{p.buyerName}&rdquo;
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-comic-red">₹{p.amount}</span>
                <span
                  className={`ml-2 text-xs px-2 py-1 rounded ${
                    p.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
