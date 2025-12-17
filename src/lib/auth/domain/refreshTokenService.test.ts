import { describe, it, expect, vi, beforeEach } from "vitest";

// Force memory repo selection
vi.mock("@/lib/core/env", () => ({
  PERSISTENCE_DRIVER: "memory",
  REFRESH_TOKEN_PEPPER: "pepper",
}));

// We use the real memory repo + helper
import { __clearRefreshTokenMemoryStore } from "@/lib/auth/repositories/refreshTokenRepository.memory";

// Mock jwtService used inside refreshTokenService
vi.mock("./jwtService", () => ({
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

import { issueRefreshToken, rotateRefreshToken } from "./refreshTokenService";
import { verifyRefreshToken, generateRefreshToken } from "./jwtService";
import { refreshTokenRepo } from "@/lib/auth/repositories/currentRefreshTokenRepo";

describe("refreshTokenService (rotation)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    __clearRefreshTokenMemoryStore();
  });

  it("rotates an active token and detects reuse when old token is presented again", async () => {
    // Deterministic token outputs
    (generateRefreshToken as any)
      .mockReturnValueOnce("rt1") // issueRefreshToken -> first token
      .mockReturnValueOnce("rt2"); // rotateRefreshToken -> second token

    // Deterministic payloads per token string
    (verifyRefreshToken as any).mockImplementation((token: string) => {
      if (token === "rt1") {
        return {
          sub: "u1",
          sid: "s1",
          jti: "t1",
          typ: "refresh",
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        };
      }
      if (token === "rt2") {
        return {
          sub: "u1",
          sid: "s1",
          jti: "t2",
          typ: "refresh",
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        };
      }
      throw new Error("Unexpected token in test");
    });

    const user = {
      id: "u1",
      email: "test@example.com",
      role: "user",
      createdAt: "2025-01-01T00:00:00.000Z",
    } as any;

    // 1) Issue
    const issued = await issueRefreshToken(user, "s1");
    expect(issued.token).toBe("rt1");

    const rec1 = await refreshTokenRepo.findByTokenId("t1");
    expect(rec1).not.toBeNull();
    expect(rec1!.revokedAt).toBeNull();

    // 2) Rotate active token
    const rotated = await rotateRefreshToken("rt1");
    expect(rotated.ok).toBe(true);
    if (rotated.ok) {
      expect(rotated.refreshToken).toBe("rt2");
      expect(rotated.userId).toBe("u1");
    }

    const rec1After = await refreshTokenRepo.findByTokenId("t1");
    expect(rec1After!.revokedAt).not.toBeNull();
    expect(rec1After!.replacedByTokenId).toBe("t2");

    const rec2 = await refreshTokenRepo.findByTokenId("t2");
    expect(rec2).not.toBeNull();
    expect(rec2!.revokedAt).toBeNull();

    // 3) Reuse detection: present old token again
    const reuse = await rotateRefreshToken("rt1");
    expect(reuse.ok).toBe(false);
    if (!reuse.ok) {
      expect(reuse.reason).toBe("REUSE_DETECTED");
    }

    // After reuse detection, whole session revoked (including t2)
    const rec2After = await refreshTokenRepo.findByTokenId("t2");
    expect(rec2After!.revokedAt).not.toBeNull();
  });
});
