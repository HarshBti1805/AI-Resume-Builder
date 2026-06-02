import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/form", "/templates", "/preview", "/start", "/editor"];

// Routes that should redirect to /start if already authenticated
const authRoutes = ["/login", "/verify"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Gate routes on the client-set "is-authed" flag cookie. The real auth token
  // lives in localStorage and is sent as a Bearer header to the API; we can't
  // read the API's httpOnly cookie here because it belongs to a different
  // domain (Render), not the client domain (Vercel).
  const isAuthenticated = request.cookies.get("is-authed")?.value === "1";

  // Protect routes — redirect to login if not authenticated
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    const startUrl = new URL("/start", request.url);
    return NextResponse.redirect(startUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/form/:path*",
    "/templates/:path*",
    "/preview/:path*",
    "/start",
    "/start/:path*",
    "/editor/:path*",
    "/login",
    "/verify",
  ],
};