import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
vi.mock("@/lib/core/env", () => ({
  NODE_ENV: "test",
}));

vi.mock("@/lib/auth/repositories/currentRepo", () => ({
  repo: {
    findById: vi.fn(),
  },
}));

vi.mock("@/lib/auth/domain/jwtService", () => ({
  signAccessToken: vi.fn(),
}));

vi.mock("@/lib/auth/domain/refreshTokenService", () => ({
  rotateRefreshToken: vi.fn(),
}));

import { repo } from "@/lib/auth/repositories/currentRepo";
import { signAccessToken } from "@/lib/auth/domain/jwtService";
import { rotateRefreshToken } from "@/lib/auth/domain/refreshTokenService";
import { GET } from "./route";

// Helper: extract set-cookie headers reliably in Node/Vitest
function getSetCookies(res: Response): string[] {
  const h: any = res.headers as any;
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

describe("GET /api/auth/refresh", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rotates refresh token, mints new access token, sets both cookies, redirects to next", async () => {
    (rotateRefreshToken as any).mockResolvedValue({
      ok: true,
      userId: "user123",
      refreshToken: "new-refresh-token",
    });

    (repo.findById as any).mockResolvedValue({
      id: "user123",
      email: "test@example.com",
      role: "user",
      createdAt: "2025-01-01T00:00:00.000Z",
    });

    (signAccessToken as any).mockReturnValue("new-access-token");

    const req = new Request("http://localhost/api/auth/refresh?next=/dashboard", {
      headers: {
        cookie: "refresh_token=old-refresh-token",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");

    const cookies = getSetCookies(res).join(" | ");

    // access cookie set
    expect(cookies).toContain("access_token=new-access-token");
    // refresh cookie rotated
    expect(cookies).toContain("refresh_token=new-refresh-token");

    expect(rotateRefreshToken).toHaveBeenCalledWith("old-refresh-token");
    expect(repo.findById).toHaveBeenCalledWith("user123");
    expect(signAccessToken).toHaveBeenCalled();
  });

  it("when rotation fails (reuse/invalid), clears cookies and redirects to /login", async () => {
    (rotateRefreshToken as any).mockResolvedValue({
      ok: false,
      reason: "REUSE_DETECTED",
    });

    const req = new Request("http://localhost/api/auth/refresh?next=/dashboard", {
      headers: {
        cookie: "refresh_token=old-refresh-token",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/login");

    const cookies = getSetCookies(res).join(" | ");
    // both cookies cleared (maxAge 0 => typically "Max-Age=0")
    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("refresh_token=");
    expect(cookies).toMatch(/Max-Age=0/);
  });

  it("when no refresh cookie, clears cookies and redirects to /login", async () => {
    const req = new Request("http://localhost/api/auth/refresh?next=/dashboard");
    const res = await GET(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/login");

    const cookies = getSetCookies(res).join(" | ");
    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("refresh_token=");
    expect(cookies).toMatch(/Max-Age=0/);
  });
});
