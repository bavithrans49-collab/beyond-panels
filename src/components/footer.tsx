"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-heroic-blue text-white mt-auto border-t-4 border-comic-red">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-heading text-xl text-golden-yellow">BEYOND PANELS</span>
          <p className="text-sm opacity-75">© 2026 Beyond Panels. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
