import crypto from "crypto";
import type { User } from "@/types/user";
import { refreshTokenRepo } from "@/lib/auth/repositories/currentRefreshTokenRepo";
import { generateRefreshToken, verifyRefreshToken } from "./jwtService";
import { REFRESH_TOKEN_PEPPER } from "@/lib/core/env";

const PEPPER = REFRESH_TOKEN_PEPPER ?? "";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function hashToken(token: string) {
  // pepper helps if DB leaks; attacker still can’t use hashes directly as cookies
  return sha256(`${token}.${PEPPER}`);
}

export async function issueRefreshToken(user: User, sessionId?: string) {
  const sid = sessionId ?? crypto.randomUUID();
  const token = generateRefreshToken({ userId: user.id, sessionId: sid });
  const payload = verifyRefreshToken(token);

  const now = new Date();
  const expMs = payload.exp ? payload.exp * 1000 : now.getTime() + 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(expMs);

  await refreshTokenRepo.create({
    tokenId: payload.jti,
    sessionId: payload.sid,
    userId: payload.sub,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt,
  });

  return { token, sessionId: sid, tokenId: payload.jti, expiresAt };
}

export async function rotateRefreshToken(presentedToken: string) {
  const payload = verifyRefreshToken(presentedToken);
  const record = await refreshTokenRepo.findByTokenId(payload.jti);

  // If it doesn’t exist, treat as invalid (could be stolen/forged/old DB reset)
  if (!record) {
    return { ok: false as const, reason: "NOT_FOUND" as const };
  }

  // If hash mismatch → token was tampered/doesn’t match stored token
  if (record.tokenHash !== hashToken(presentedToken)) {
    return { ok: false as const, reason: "HASH_MISMATCH" as const };
  }

  // Reuse detection: revoked token presented again
  if (record.revokedAt) {
    // Revoke whole session family
    await refreshTokenRepo.revokeSession(record.sessionId, new Date());
    return { ok: false as const, reason: "REUSE_DETECTED" as const };
  }

  // Valid active token: rotate
  const now = new Date();
  await refreshTokenRepo.markUsed(record.tokenId, now);

  // Revoke old token and replace with new token in same session family
  const newToken = generateRefreshToken({ userId: record.userId, sessionId: record.sessionId });
  const newPayload = verifyRefreshToken(newToken);

  // Revoke old first (prevents races)
  await refreshTokenRepo.revokeToken(record.tokenId, now, newPayload.jti);

  const expMs = newPayload.exp ? newPayload.exp * 1000 : now.getTime() + 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(expMs);

  await refreshTokenRepo.create({
    tokenId: newPayload.jti,
    sessionId: newPayload.sid,
    userId: newPayload.sub,
    tokenHash: hashToken(newToken),
    createdAt: now,
    expiresAt,
  });

  return { ok: true as const, userId: record.userId, refreshToken: newToken };
}

export async function revokeSessionFromRefreshToken(presentedToken: string) {
  const payload = verifyRefreshToken(presentedToken);
  const record = await refreshTokenRepo.findByTokenId(payload.jti);
  if (!record) return;
  await refreshTokenRepo.revokeSession(record.sessionId, new Date());
}
