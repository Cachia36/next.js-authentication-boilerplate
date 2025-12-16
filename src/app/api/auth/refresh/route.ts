import { NextResponse } from "next/server";
import { repo } from "@/lib/auth/repositories/currentRepo";
import { signAccessToken, verifyRefreshToken } from "@/lib/auth/domain/jwtService";
import { NODE_ENV } from "@/lib/core/env";

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

  // Read refresh cookie from request header
  const refresh = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("refresh_token="))
    ?.split("=")[1];

  // If no refresh token, treat as logged out
  if (!refresh) {
    const res = NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
    return clearAuthCookies(res);
  }

  try {
    const { sub } = verifyRefreshToken(decodeURIComponent(refresh));
    const user = await repo.findById(sub);

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

    res.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60,
    });

    return res;
  } catch {
    const res = NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
    return clearAuthCookies(res);
  }
}
