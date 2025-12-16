import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenEdge } from "@/lib/auth/domain/jwtEdge";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const accessToken = req.cookies.get("access_token")?.value;
  const hasRefresh = Boolean(req.cookies.get("refresh_token")?.value);

  let accessValid = false;
  if (accessToken) {
    try {
      await verifyAccessTokenEdge(accessToken);
      accessValid = true;
    } catch {}
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  if (isAuthPage) {
    if (accessValid) return NextResponse.redirect(new URL("/dashboard", req.url));
    if (hasRefresh) {
      const refreshUrl = new URL("/api/auth/refresh", req.url);
      refreshUrl.searchParams.set("next", "/dashboard");
      return NextResponse.redirect(refreshUrl);
    }
    return NextResponse.next();
  }

  if (isDashboard || isAdmin) {
    if (!accessValid && hasRefresh) {
      const next = pathname + search;
      const refreshUrl = new URL("/api/auth/refresh", req.url);
      refreshUrl.searchParams.set("next", next);
      return NextResponse.redirect(refreshUrl);
    }
    if (!accessValid && !hasRefresh) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}
