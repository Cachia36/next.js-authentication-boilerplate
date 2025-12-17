import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/repositories/currentRepo", () => ({
  repo: {
    findByEmail: vi.fn(),
    createUser: vi.fn(),
  },
}));

vi.mock("@/lib/auth/domain/jwtService", () => ({
  generateAccessToken: vi.fn(),
}));

vi.mock("@/lib/auth/domain/refreshTokenService", () => ({
  issueRefreshToken: vi.fn(),
}));

vi.mock("@/lib/auth/domain/passwordService", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { authService } from "./authService";
import { repo } from "@/lib/auth/repositories/currentRepo";
import { generateAccessToken } from "@/lib/auth/domain/jwtService";
import { issueRefreshToken } from "@/lib/auth/domain/refreshTokenService";
import { hashPassword, verifyPassword } from "@/lib/auth/domain/passwordService";

describe("authService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("register", () => {
    it("creates user, returns access + refresh tokens", async () => {
      (repo.findByEmail as any).mockResolvedValue(null);
      (hashPassword as any).mockResolvedValue("hashed_pw");

      const createdUser = {
        id: "u1",
        email: "new@example.com",
        role: "user",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      (repo.createUser as any).mockResolvedValue(createdUser);
      (generateAccessToken as any).mockReturnValue("access-token");
      (issueRefreshToken as any).mockResolvedValue({ token: "refresh-token" });

      // IMPORTANT: authService.register(email, password)
      const res = await authService.register("new@example.com", "pass123");

      expect(repo.findByEmail).toHaveBeenCalledWith("new@example.com"); // normalized should match
      expect(hashPassword).toHaveBeenCalledWith("pass123");
      expect(repo.createUser).toHaveBeenCalled();
      expect(generateAccessToken).toHaveBeenCalledWith(createdUser);
      expect(issueRefreshToken).toHaveBeenCalledWith(createdUser);

      expect(res).toEqual({
        user: createdUser,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });

  describe("login", () => {
    it("returns access + refresh tokens when password matches", async () => {
      const userFromDb = {
        id: "u1",
        email: "test@example.com",
        role: "user",
        passwordHash: "hashed_pw",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      (repo.findByEmail as any).mockResolvedValue(userFromDb);
      (verifyPassword as any).mockResolvedValue(true);

      (generateAccessToken as any).mockReturnValue("access-token");
      (issueRefreshToken as any).mockResolvedValue({ token: "refresh-token" });

      const res = await authService.login("test@example.com", "pass123");

      expect(repo.findByEmail).toHaveBeenCalledWith("test@example.com");
      expect(verifyPassword).toHaveBeenCalledWith("pass123", "hashed_pw");

      // authService removes passwordHash before token minting
      const safeUser = {
        id: "u1",
        email: "test@example.com",
        role: "user",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      expect(generateAccessToken).toHaveBeenCalledWith(safeUser);
      expect(issueRefreshToken).toHaveBeenCalledWith(safeUser);

      expect(res).toEqual({
        user: safeUser,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });
});
