import { NextResponse } from "next/server";
import { NODE_ENV } from "@/lib/core/env";
import { withApiRoute } from "@/lib/http/withApiRoute";
import { revokeSessionFromRefreshToken } from "@/lib/auth/domain/refreshTokenService";

function readCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie");
  if (!raw) return null;

  const parts = raw.split(";").map((c) => c.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

const handler = async (req: Request): Promise<Response> => {
  const res = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  const isProd = NODE_ENV === "production";

  const refresh = readCookie(req, "refresh_token");
  if (refresh) {
    // best-effort: revoke family; even if it throws we still clear cookies
    try {
      await revokeSessionFromRefreshToken(refresh);
    } catch {}
  }

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
};

export const POST = withApiRoute(handler);
