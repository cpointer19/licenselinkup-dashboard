import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME    = "lll_auth";
const PUBLIC_PATHS   = ["/login", "/api/auth", "/api/slack"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API through unconditionally
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.match(/\.(svg|png|ico|jpg)$/)) {
    return NextResponse.next();
  }

  const token    = request.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.AUTH_SESSION_TOKEN;

  if (!token || token !== expected) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
