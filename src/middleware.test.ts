import { describe, it, expect, vi, beforeEach } from "vitest";

// ----------------------
// Mock verifyAccessTokenEdge BEFORE importing middleware
// ----------------------
vi.mock("./lib/auth/domain/jwtEdge", () => ({
  verifyAccessTokenEdge: vi.fn(),
}));

// ----------------------
// Mock next/server BEFORE importing middleware
// ----------------------
vi.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: Headers;

    constructor(status = 200) {
      this.status = status;
      this.headers = new Headers();
    }

    static next() {
      return { type: "next" } as any;
    }

    static redirect(url: URL | string, status = 307) {
      const res = new MockNextResponse(status);
      res.headers.set("location", typeof url === "string" ? url : url.toString());
      return res as any;
    }
  }

  return { NextResponse: MockNextResponse };
});

// ----------------------
// Imports AFTER mocks
// ----------------------
import { middleware } from "./middleware";
import { verifyAccessTokenEdge } from "./lib/auth/domain/jwtEdge";

// ----------------------
// Helpers
// ----------------------
function makeReq(url: string, cookies: Record<string, string> = {}) {
  const u = new URL(url);

  return {
    url: u.toString(),
    nextUrl: {
      pathname: u.pathname,
      search: u.search,
    },
    cookies: {
      get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined),
    },
  } as any;
}

// ----------------------
// Tests
// ----------------------
describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1) Auth pages
  it("redirects auth pages to /dashboard when access_token is valid", async () => {
    (verifyAccessTokenEdge as any).mockResolvedValue({ sub: "user-id" });

    const req = makeReq("http://localhost/login", { access_token: "valid" });
    const res: any = await middleware(req);

    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects auth pages to /api/auth/refresh when only refresh_token exists", async () => {
    const req = makeReq("http://localhost/login", { refresh_token: "refresh" });
    const res: any = await middleware(req);

    expect(res.headers.get("location")).toBe("http://localhost/api/auth/refresh?next=%2Fdashboard");
  });

  it("allows auth pages when no tokens exist", async () => {
    const req = makeReq("http://localhost/login");
    const res: any = await middleware(req);

    expect(res.type).toBe("next");
  });

  // 2) Protected pages
  it("redirects protected page to refresh when access_token is invalid but refresh_token exists", async () => {
    (verifyAccessTokenEdge as any).mockRejectedValue(new Error("invalid"));

    const req = makeReq("http://localhost/dashboard/settings?x=1", {
      access_token: "invalid",
      refresh_token: "refresh",
    });

    const res: any = await middleware(req);

    expect(res.headers.get("location")).toBe(
      "http://localhost/api/auth/refresh?next=%2Fdashboard%2Fsettings%3Fx%3D1",
    );
  });

  it("redirects protected page to /login when missing both tokens", async () => {
    const req = makeReq("http://localhost/dashboard");
    const res: any = await middleware(req);

    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("allows protected page when access_token is valid", async () => {
    (verifyAccessTokenEdge as any).mockResolvedValue({ sub: "user-id" });

    const req = makeReq("http://localhost/dashboard", { access_token: "valid" });
    const res: any = await middleware(req);

    expect(res.type).toBe("next");
  });

  it("allows non-protected routes", async () => {
    const req = makeReq("http://localhost/about");
    const res: any = await middleware(req);

    expect(res.type).toBe("next");
  });

  it("also protects /admin routes the same way", async () => {
    const req = makeReq("http://localhost/admin?tab=users", { refresh_token: "refresh" });
    const res: any = await middleware(req);

    expect(res.headers.get("location")).toBe(
      "http://localhost/api/auth/refresh?next=%2Fadmin%3Ftab%3Dusers",
    );
  });
});
