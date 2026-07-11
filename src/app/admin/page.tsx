"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ComicSummary {
  id: string;
  title: string;
  series: string | null;
  issueNumber: number | null;
  price: number;
  _count: { purchases: number; pages: number };
}

interface Purchase {
  id: string;
  user: { name: string; email: string };
  comic: { title: string };
  buyerName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string; email: string };
  comic: { title: string; id: string };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [comics, setComics] = useState<ComicSummary[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [tab, setTab] = useState<"comics" | "sales" | "reviews" | "users">("sales");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !user?.isAdmin)) {
      router.push("/");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/comics")
      .then((res) => res.json())
      .then(setComics);

    fetch("/api/purchase")
      .then((res) => res.json())
      .then(setPurchases);

    fetch("/api/admin/reviews")
      .then((res) => res.json())
      .then(setReviews)
      .catch(() => {});

    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((d) => { setUserCount(d.count); setUsers(d.users || []); })
      .catch(() => {});
  }, [status, router, user]);

  if (status === "loading") {
    return <div className="text-center py-20 font-mono text-gray-500">Loading...</div>;
  }

  const totalRevenue = purchases
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPurchases = purchases.filter((p) => p.status === "pending");

  const filteredPurchases = filter === "all" ? purchases : purchases.filter((p) => p.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">Dashboard</h1>
          <p className="text-sm text-gray-500 font-mono">Logged in as {user?.name}</p>
        </div>
        <Link
          href="/admin/comics/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
        >
          + New Comic
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">Total Comics</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{comics.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">Total Sales</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{purchases.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">₹{totalRevenue}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">Accounts</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{userCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingPurchases.length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("sales")}
          className={`px-4 py-2 rounded text-sm font-mono transition ${
            tab === "sales"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Sales Log
        </button>
        <button
          onClick={() => setTab("comics")}
          className={`px-4 py-2 rounded text-sm font-mono transition ${
            tab === "comics"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Comics ({comics.length})
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={`px-4 py-2 rounded text-sm font-mono transition ${
            tab === "reviews"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded text-sm font-mono transition ${
            tab === "users"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Users ({userCount})
        </button>
      </div>

      {tab === "sales" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-2">
            {(["all", "pending", "confirmed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded font-mono ${
                  filter === f
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-mono text-sm">No sales yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Comic</th>
                    <th className="p-3 font-medium">Buyer</th>
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium">{p.comic.title}</td>
                      <td className="p-3">{p.buyerName}</td>
                      <td className="p-3 text-xs text-gray-500">{p.user.name} ({p.user.email})</td>
                      <td className="p-3 font-medium">₹{p.amount}</td>
                      <td className="p-3">
                        {p.status === "confirmed" ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-medium">
                            Confirmed
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-mono text-sm">No reviews yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Comic</th>
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Rating</th>
                    <th className="p-3 font-medium">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium">{r.comic.title}</td>
                      <td className="p-3 text-xs text-gray-500">{r.user.name} ({r.user.email})</td>
                      <td className="p-3">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                      <td className="p-3 text-gray-700 max-w-xs truncate">{r.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-mono text-sm">No users yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3">
                        {u.isAdmin ? (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-medium">Admin</span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">User</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "comics" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {comics.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-mono text-sm">No comics yet</div>
          ) : (
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Issue</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Pages</th>
                  <th className="p-3 font-medium">Sold</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comics.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.title}</td>
                    <td className="p-3 text-gray-500">
                      {c.series} {c.issueNumber ? `#${c.issueNumber}` : "-"}
                    </td>
                    <td className="p-3">₹{c.price}</td>
                    <td className="p-3">{c._count.pages}</td>
                    <td className="p-3">{c._count.purchases}</td>
                    <td className="p-3 flex gap-2">
                      <Link
                        href={`/admin/comics/${c.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
                          const res = await fetch(`/api/admin/comics/${c.id}`, { method: "DELETE" });
                          if (res.ok) {
                            setComics((prev) => prev.filter((x) => x.id !== c.id));
                          } else {
                            alert("Failed to delete");
                          }
                        }}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
