import { describe, it, expect, vi, beforeEach } from "vitest";

// ----------------------
// Mocks (before imports)
// ----------------------

vi.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: Headers;
    cookies: {
      set: (name: string, value: string, options: any) => void;
      get: (name: string) => any;
      all: () => any[];
    };

    private _cookieStore = new Map<string, { value: string; options: any }>();

    constructor(status = 200, headers?: Headers) {
      this.status = status;
      this.headers = headers ?? new Headers();
      this.cookies = {
        set: (name: string, value: string, options: any) => {
          this._cookieStore.set(name, { value, options });
        },
        get: (name: string) => this._cookieStore.get(name),
        all: () => Array.from(this._cookieStore.entries()).map(([name, v]) => ({ name, ...v })),
      };
    }

    static redirect(url: URL | string, init?: number | { status?: number }) {
      const status = typeof init === "number" ? init : (init?.status ?? 307);

      const res = new MockNextResponse(status);
      res.headers.set("location", typeof url === "string" ? url : url.toString());
      return res as any;
    }
  }

  return { NextResponse: MockNextResponse };
});

vi.mock("@/lib/core/env", () => ({
  NODE_ENV: "test",
}));

const mockFindById = vi.fn();
vi.mock("@/lib/auth/repositories/currentRepo", () => ({
  repo: {
    findById: (...args: any[]) => mockFindById(...args),
  },
}));

const mockVerifyRefreshToken = vi.fn();
const mockSignAccessToken = vi.fn();
vi.mock("@/lib/auth/domain/jwtService", () => ({
  verifyRefreshToken: (...args: any[]) => mockVerifyRefreshToken(...args),
  signAccessToken: (...args: any[]) => mockSignAccessToken(...args),
}));

// ----------------------
// Import after mocks
// ----------------------
import { GET } from "./route";

function makeReq(url: string, cookieHeader?: string) {
  return new Request(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

describe("GET /api/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when refresh cookie is missing", async () => {
    const req = makeReq("http://localhost/api/auth/refresh?next=/dashboard");

    const res: any = await GET(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects to /login when refresh token is invalid", async () => {
    mockVerifyRefreshToken.mockImplementationOnce(() => {
      throw new Error("bad token");
    });

    const req = makeReq("http://localhost/api/auth/refresh?next=/dashboard", "refresh_token=bad");

    const res: any = await GET(req);

    expect(mockVerifyRefreshToken).toHaveBeenCalledWith("bad");
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects to /login when user is not found", async () => {
    mockVerifyRefreshToken.mockReturnValueOnce({ sub: "user-1" });
    mockFindById.mockResolvedValueOnce(null);

    const req = makeReq("http://localhost/api/auth/refresh?next=/dashboard", "refresh_token=valid");

    const res: any = await GET(req);

    expect(mockFindById).toHaveBeenCalledWith("user-1");
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("sets access_token cookie and redirects to next when valid", async () => {
    mockVerifyRefreshToken.mockReturnValueOnce({ sub: "user-1" });
    mockFindById.mockResolvedValueOnce({
      id: "user-1",
      email: "user@email.com",
      role: "user",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    mockSignAccessToken.mockReturnValueOnce("new-access-token");

    const req = makeReq(
      "http://localhost/api/auth/refresh?next=/admin?tab=users",
      "refresh_token=valid",
    );

    const res: any = await GET(req);

    expect(mockSignAccessToken).toHaveBeenCalledWith({
      sub: "user-1",
      email: "user@email.com",
      role: "user",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    expect(res.headers.get("location")).toBe("http://localhost/admin?tab=users");

    const cookie = res.cookies.get("access_token");
    expect(cookie?.value).toBe("new-access-token");
    expect(cookie?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 15 * 60,
    });
  });

  it("handles URL-encoded cookie values (decodeURIComponent path)", async () => {
    mockVerifyRefreshToken.mockReturnValueOnce({ sub: "user-1" });
    mockFindById.mockResolvedValueOnce({
      id: "user-1",
      email: "user@email.com",
      role: "user",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    mockSignAccessToken.mockReturnValueOnce("new-access-token");

    const encoded = encodeURIComponent("valid.token.value");
    const req = makeReq(
      "http://localhost/api/auth/refresh?next=/dashboard",
      `refresh_token=${encoded}`,
    );

    const res: any = await GET(req);

    // your route splits then decodeURIComponent(refresh || "")
    expect(mockVerifyRefreshToken).toHaveBeenCalledWith("valid.token.value");
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("parses refresh_token among multiple cookies", async () => {
    mockVerifyRefreshToken.mockReturnValueOnce({ sub: "user-1" });
    mockFindById.mockResolvedValueOnce({
      id: "user-1",
      email: "user@email.com",
      role: "user",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    mockSignAccessToken.mockReturnValueOnce("new-access-token");

    const req = makeReq(
      "http://localhost/api/auth/refresh?next=/dashboard",
      "foo=bar; refresh_token=valid; hello=world",
    );

    const res: any = await GET(req);

    expect(mockVerifyRefreshToken).toHaveBeenCalledWith("valid");
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
