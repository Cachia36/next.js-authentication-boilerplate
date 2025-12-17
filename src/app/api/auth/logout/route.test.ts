import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
vi.mock("next/server", async () => {
  // use real NextResponse implementation (important for cookies headers)
  const actual: any = await vi.importActual("next/server");
  return actual;
});

vi.mock("@/lib/core/env", () => ({
  NODE_ENV: "test",
}));

vi.mock("@/lib/auth/domain/refreshTokenService", () => ({
  revokeSessionFromRefreshToken: vi.fn(),
}));

// IMPORTANT: withApiRoute wraps the handler. For unit tests we want it to be transparent.
vi.mock("@/lib/http/withApiRoute", () => ({
  withApiRoute: (handler: any) => handler,
}));

import { revokeSessionFromRefreshToken } from "@/lib/auth/domain/refreshTokenService";
import { POST } from "./route";

// Helper to read Set-Cookie headers across environments
function getSetCookies(res: Response): string[] {
  const h: any = res.headers as any;
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("clears access_token and refresh_token cookies even when no refresh cookie is present", async () => {
    const req = new Request("http://localhost/api/auth/logout", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(200);

    // Revoke should not be called (no refresh cookie)
    expect(revokeSessionFromRefreshToken).not.toHaveBeenCalled();

    const cookies = getSetCookies(res).join(" | ");

    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("refresh_token=");
    expect(cookies).toMatch(/Max-Age=0/);
  });

  it("calls revokeSessionFromRefreshToken when refresh_token cookie is present and still clears cookies", async () => {
    (revokeSessionFromRefreshToken as any).mockResolvedValue(undefined);

    const req = new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: "refresh_token=rt1; access_token=at1",
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(revokeSessionFromRefreshToken).toHaveBeenCalledTimes(1);
    expect(revokeSessionFromRefreshToken).toHaveBeenCalledWith("rt1");

    const cookies = getSetCookies(res).join(" | ");
    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("refresh_token=");
    expect(cookies).toMatch(/Max-Age=0/);
  });

  it("still clears cookies even if revokeSessionFromRefreshToken throws", async () => {
    (revokeSessionFromRefreshToken as any).mockRejectedValue(new Error("db down"));

    const req = new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: "refresh_token=rt1",
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);

    expect(revokeSessionFromRefreshToken).toHaveBeenCalledTimes(1);
    expect(revokeSessionFromRefreshToken).toHaveBeenCalledWith("rt1");

    const cookies = getSetCookies(res).join(" | ");
    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("refresh_token=");
    expect(cookies).toMatch(/Max-Age=0/);
  });
});
