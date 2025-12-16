import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "./getServerSession";

// Mock next/headers cookies()
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock verifyAccessToken()
vi.mock("@/lib/auth/domain/jwtService", () => ({
  verifyAccessToken: vi.fn(),
}));

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/domain/jwtService";

describe("getServerSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user: null when access_token cookie is missing", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const result = await getServerSession();
    expect(result).toEqual({ user: null });
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it("returns user when access token is valid", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "valid-token" }),
    });

    (verifyAccessToken as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sub: "user-1",
      email: "user@email.com",
      role: "user",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const result = await getServerSession();

    // If you're still casting payload->User, this expectation should match payload.
    // If you implement payloadToUser mapping, update expected to match your User shape.
    expect(result.user).toMatchObject({
      id: "user-1",
      email: "user@email.com",
      role: "user",
    });

    expect(verifyAccessToken).toHaveBeenCalledWith("valid-token");
  });

  it("returns user: null when access token is invalid/expired", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "bad-token" }),
    });

    (verifyAccessToken as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("invalid");
    });

    const result = await getServerSession();
    expect(result).toEqual({ user: null });
  });
});
