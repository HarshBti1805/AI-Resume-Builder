import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/form", "/templates", "/preview", "/start", "/editor"];

// Routes that should redirect to /start if already authenticated
const authRoutes = ["/login", "/verify"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token cookie (httpOnly cookies are readable in middleware)
  const accessToken = request.cookies.get("accessToken")?.value;
  const isAuthenticated = !!accessToken;

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