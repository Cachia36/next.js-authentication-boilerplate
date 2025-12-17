import type { User, DbUser } from "@/types/user";
import { HttpError } from "../../core/errors";
import { repo } from "../repositories/currentRepo";
import { hashPassword, verifyPassword } from "./passwordService";
import { generateAccessToken, verifyAccessToken } from "./jwtService";
import type { AuthTokenPayload } from "@/types/auth";
import { logAuthEvent } from "../../core/logger";
import { Unauthorized, Conflict } from "../../core/errors";
import { issueRefreshToken } from "./refreshTokenService";

export type AuthResult = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

function toPublicUser(dbUser: DbUser): User {
  // We intentionally strip sensitive fields from the user object.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, passwordResetToken, passwordResetExpiresAt, ...rest } = dbUser;
  return rest;
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await repo.findByEmail(normalizedEmail);
    if (existing) {
      throw Conflict("Email already in use", "AUTH_EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(password);

    const created = await repo.createUser({
      email: normalizedEmail,
      passwordHash,
      role: "user",
    });

    const user = toPublicUser(created);
    const accessToken = generateAccessToken(user);
    const { token: refreshToken } = await issueRefreshToken(user);

    logAuthEvent("register_success", { userId: user.id, email: user.email });

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const found = await repo.findByEmail(normalizedEmail);
    if (!found) {
      logAuthEvent("login_failed_no_user", { email: normalizedEmail });
      throw Unauthorized("Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    const match = await verifyPassword(password, found.passwordHash);
    if (!match) {
      logAuthEvent("login_failed_bad_password", { userId: found.id });
      throw Unauthorized("Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    const user = toPublicUser(found);
    const accessToken = generateAccessToken(user);
    const { token: refreshToken } = await issueRefreshToken(user);

    logAuthEvent("login_success", { userId: user.id });

    return { user, accessToken, refreshToken };
  },

  async getUserFromAccessToken(token: string): Promise<User> {
    const payload: AuthTokenPayload = verifyAccessToken(token);

    const user: User = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      createdAt: payload.createdAt,
    };

    return user;
  },

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);

    try {
      await repo.updatePassword(userId, passwordHash);
      await repo.clearPasswordResetToken(userId);

      logAuthEvent("password_reset_success", { userId });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        throw err;
      }

      logAuthEvent("password_reset_failed", { userId });
      throw new HttpError(500, "Failed to update password", "PASSWORD_RESET_FAILED");
    }
  },
};
