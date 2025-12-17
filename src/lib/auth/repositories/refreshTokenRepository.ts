import type { RefreshTokenRecord } from "@/types/refreshToken";

export type CreateRefreshTokenInput = Omit<
  RefreshTokenRecord,
  "revokedAt" | "replacedByTokenId" | "lastUsedAt"
> & {
  revokedAt?: Date | null;
  replacedByTokenId?: string | null;
  lastUsedAt?: Date | null;
};

export interface RefreshTokenRepository {
  create(data: CreateRefreshTokenInput): Promise<void>;
  findByTokenId(tokenId: string): Promise<RefreshTokenRecord | null>;

  markUsed(tokenId: string, usedAt: Date): Promise<void>;
  revokeToken(tokenId: string, revokedAt: Date, replacedByTokenId: string | null): Promise<void>;

  revokeSession(sessionId: string, revokedAt: Date): Promise<void>;
}
