import jwt from "jsonwebtoken";
import type { User } from "@/types/user";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../../core/env";
import { Unauthorized } from "../../core/errors";
import type { AuthTokenPayload } from "@/types/auth";
import crypto from "crypto";
import type { RefreshTokenJwtPayload } from "@/types/refreshToken";

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

export function generateRefreshToken(input: { userId: string; sessionId: string }): string {
  const jti = crypto.randomUUID();

  const payload: RefreshTokenJwtPayload = {
    sub: input.userId,
    sid: input.sessionId,
    jti,
    typ: "refresh",
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    throw Unauthorized("Invalid or expired access token", "TOKEN_INVALID");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenJwtPayload {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenJwtPayload;

    if (payload.typ !== "refresh" || !payload.sub || !payload.sid || !payload.jti) {
      throw new Error("Invalid refresh payload");
    }

    return payload;
  } catch {
    throw Unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
  }
}
