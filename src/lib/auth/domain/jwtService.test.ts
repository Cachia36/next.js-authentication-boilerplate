import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwtService";
import type { User } from "@/types/user";

// --------------------
// Mocks
// --------------------

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock("../../core/env", () => ({
  JWT_SECRET: "access-secret",
  JWT_REFRESH_SECRET: "refresh-secret",
}));

const mockSign = jwt.sign as unknown as ReturnType<typeof vi.fn>;
const mockVerify = jwt.verify as unknown as ReturnType<typeof vi.fn>;

// --------------------
// Fixtures
// --------------------

const mockUser: User = {
  id: "user-1",
  email: "user@email.com",
  role: "user",
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("jwtService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("generates an access token with correct payload and options", () => {
      mockSign.mockReturnValueOnce("access-token");

      const token = generateAccessToken(mockUser);

      expect(mockSign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
        },
        "access-secret",
        { expiresIn: "15m" },
      );

      expect(token).toBe("access-token");
    });

    it("fills createdAt if missing on user", () => {
      mockSign.mockReturnValueOnce("access-token");

      const userNoCreatedAt: User = {
        id: "user-1",
        email: "user@email.com",
        role: "user",
      } as any;

      const token = generateAccessToken(userNoCreatedAt);

      const call = mockSign.mock.calls[0];
      expect(call[0]).toMatchObject({
        sub: "user-1",
        email: "user@email.com",
        role: "user",
      });
      expect(typeof call[0].createdAt).toBe("string");

      expect(token).toBe("access-token");
    });
  });

  describe("generateRefreshToken", () => {
    it("generates a refresh token with correct payload and options", () => {
      mockSign.mockReturnValueOnce("refresh-token");

      const token = generateRefreshToken(mockUser);

      expect(mockSign).toHaveBeenCalledWith({ sub: mockUser.id }, "refresh-secret", {
        expiresIn: "7d",
      });

      expect(token).toBe("refresh-token");
    });
  });

  describe("verifyAccessToken", () => {
    it("returns payload when token is valid", () => {
      mockVerify.mockReturnValueOnce({
        sub: "user-1",
        email: "user@email.com",
        role: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const result = verifyAccessToken("valid-token");

      expect(mockVerify).toHaveBeenCalledWith("valid-token", "access-secret");
      expect(result).toEqual({
        sub: "user-1",
        email: "user@email.com",
        role: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
      });
    });

    it("throws HttpError 401 when token is invalid or expired", () => {
      mockVerify.mockImplementationOnce(() => {
        throw new Error("jwt invalid");
      });

      expect(() => verifyAccessToken("bad-token")).toThrowError();
      try {
        verifyAccessToken("bad-token");
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe("TOKEN_INVALID");
      }
    });
  });

  describe("verifyRefreshToken", () => {
    it("returns payload when refresh token is valid (minimal payload)", () => {
      mockVerify.mockReturnValueOnce({
        sub: "user-1",
        // refresh token payload is intentionally minimal
      });

      const result = verifyRefreshToken("valid-refresh-token");

      expect(mockVerify).toHaveBeenCalledWith("valid-refresh-token", "refresh-secret");
      expect(result).toEqual({ sub: "user-1" });
    });

    it("throws HttpError 401 when refresh token is invalid or expired", () => {
      mockVerify.mockImplementationOnce(() => {
        throw new Error("jwt invalid");
      });

      expect(() => verifyRefreshToken("bad-token")).toThrowError();
      try {
        verifyRefreshToken("bad-token");
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe("REFRESH_TOKEN_INVALID");
      }
    });
  });
});
