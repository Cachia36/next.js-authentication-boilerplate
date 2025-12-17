import { NextResponse } from "next/server";
import { repo } from "@/lib/auth/repositories/currentRepo";
import { signAccessToken } from "@/lib/auth/domain/jwtService";
import { rotateRefreshToken } from "@/lib/auth/domain/refreshTokenService";
import { NODE_ENV } from "@/lib/core/env";

function readCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie");
  if (!raw) return null;

  // very small safe parser (no deps)
  const parts = raw.split(";").map((c) => c.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

function clearAuthCookies(res: NextResponse) {
  const isProd = NODE_ENV === "production";

  res.cookies.set("access_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    secure: isProd,
    sameSite: "lax",
  });

  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    secure: isProd,
    sameSite: "lax",
  });

  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/dashboard";

  const refresh = readCookie(req, "refresh_token");

  if (!refresh) {
    const res = NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
    return clearAuthCookies(res);
  }

  try {
    const rotation = await rotateRefreshToken(refresh);

    // Invalid / reuse detected → force logout everywhere in that session family
    if (!rotation.ok) {
      const res = NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
      return clearAuthCookies(res);
    }

    const user = await repo.findById(rotation.userId);
    if (!user) {
      const res = NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
      return clearAuthCookies(res);
    }

    const newAccessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt ?? new Date().toISOString(),
    });

    const res = NextResponse.redirect(new URL(next, url.origin), { status: 303 });

    const isProd = NODE_ENV === "production";

    // Access token refreshed
    res.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 15 * 60,
    });

    // Refresh token rotated (IMPORTANT)
    res.cookies.set("refresh_token", rotation.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch {
    const res = NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
    return clearAuthCookies(res);
  }
}
