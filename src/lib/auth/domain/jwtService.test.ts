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

      const token = generateRefreshToken({ userId: mockUser.id, sessionId: "sid-123" });

      expect(mockSign).toHaveBeenCalledTimes(1);

      const [payload, secret, options] = mockSign.mock.calls[0];

      expect(secret).toBe("refresh-secret");
      expect(options).toEqual({ expiresIn: "7d" });

      expect(payload).toMatchObject({
        sub: mockUser.id,
        sid: "sid-123",
        typ: "refresh",
      });

      // jti should be generated
      expect(typeof (payload as any).jti).toBe("string");
      expect((payload as any).jti.length).toBeGreaterThan(5);

      expect(token).toBe("refresh-token");
    });
  });

  describe("verifyRefreshToken", () => {
    it("returns payload when refresh token is valid (minimal payload)", () => {
      mockVerify.mockReturnValueOnce({
        sub: mockUser.id,
        sid: "sid-123",
        jti: "jti-123",
        typ: "refresh",
      });

      const payload = verifyRefreshToken("valid-refresh-token");

      expect(mockVerify).toHaveBeenCalledWith("valid-refresh-token", "refresh-secret");

      expect(payload).toEqual({
        sub: mockUser.id,
        sid: "sid-123",
        jti: "jti-123",
        typ: "refresh",
      });
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

    it("throws HttpError 401 when refresh token payload is missing required fields", () => {
      mockVerify.mockReturnValueOnce({
        sub: mockUser.id,
        // sid missing
        jti: "jti-123",
        typ: "refresh",
      });

      expect(() => verifyRefreshToken("token-with-bad-payload")).toThrowError();

      try {
        verifyRefreshToken("token-with-bad-payload");
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe("REFRESH_TOKEN_INVALID");
      }
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
});
