import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/reader/undefined" || pathname.startsWith("/reader/undefined")) {
    return NextResponse.redirect(new URL("/library", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/reader/:path*",
};
