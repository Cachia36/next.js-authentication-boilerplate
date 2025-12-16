import jwt from "jsonwebtoken";
import type { User } from "@/types/user";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../../core/env";
import { Unauthorized } from "../../core/errors";
import type { AuthTokenPayload } from "@/types/auth";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// Use this when you already have the payload (e.g. in getServerSession)
export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

// Convenience wrapper (existing callers can keep using this)
export function generateAccessToken(user: User): string {
  return signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt ?? new Date().toISOString(),
  });
}

// Refresh token should be minimal: only user id
export function generateRefreshToken(user: User): string {
  return jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    throw Unauthorized("Invalid or expired access token", "TOKEN_INVALID");
  }
}

export function verifyRefreshToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw Unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
  }
}
