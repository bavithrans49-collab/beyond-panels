"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart-context";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const { count } = useCart();
  const user = session?.user as any;
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="bg-heroic-blue text-white border-b-4 border-golden-yellow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-heading text-2xl font-bold text-golden-yellow">
              BEYOND PANELS
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/catalog" className="hover:text-golden-yellow transition font-semibold">
              CATALOG
            </Link>

            {session ? (
              <>
                <Link href="/library" className="hover:text-golden-yellow transition font-semibold">
                  LIBRARY
                </Link>
                <Link href="/cart" className="hover:text-golden-yellow transition font-semibold relative">
                  CART
                  {count > 0 && (
                    <span className="absolute -top-2 -right-4 bg-comic-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {count}
                    </span>
                  )}
                </Link>
                {user?.isAdmin && (
                  <Link href="/admin" className="hover:text-golden-yellow transition font-semibold text-golden-yellow">
                    ADMIN
                  </Link>
                )}
                <span className="text-sm opacity-75">{user?.name}</span>
                <button onClick={() => signOut()} className="bg-comic-red px-3 py-1 rounded font-bold text-sm hover:bg-red-700 transition">
                  LOGOUT
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="bg-golden-yellow text-ink-black px-4 py-2 rounded font-bold hover:bg-yellow-400 transition">
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
