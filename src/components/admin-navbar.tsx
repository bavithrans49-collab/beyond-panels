"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function AdminNavbar() {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/comics/new", label: "New Comic" },
  ];

  return (
    <div className="bg-gray-900 text-white border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <Link href="/admin" className="font-mono text-sm font-bold text-yellow-400 mr-4">
              ADMIN / BEYOND PANELS
            </Link>
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                  pathname === tab.href
                    ? "bg-yellow-400 text-black"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-white transition">
              ← View Store
            </Link>
            <button
              onClick={() => signOut()}
              className="text-xs bg-red-600 px-3 py-1.5 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
