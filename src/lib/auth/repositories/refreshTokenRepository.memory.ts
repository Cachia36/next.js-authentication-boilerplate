import type { RefreshTokenRepository, CreateRefreshTokenInput } from "./refreshTokenRepository";
import type { RefreshTokenRecord } from "@/types/refreshToken";

const store = new Map<string, RefreshTokenRecord>(); // tokenId -> record

export const memoryRefreshTokenRepository: RefreshTokenRepository = {
  async create(data: CreateRefreshTokenInput) {
    const record: RefreshTokenRecord = {
      ...data,
      revokedAt: data.revokedAt ?? null,
      replacedByTokenId: data.replacedByTokenId ?? null,
      lastUsedAt: data.lastUsedAt ?? null,
    };
    store.set(record.tokenId, record);
  },

  async findByTokenId(tokenId: string) {
    return store.get(tokenId) ?? null;
  },

  async markUsed(tokenId: string, usedAt: Date) {
    const existing = store.get(tokenId);
    if (!existing) return;
    store.set(tokenId, { ...existing, lastUsedAt: usedAt });
  },

  async revokeToken(tokenId: string, revokedAt: Date, replacedByTokenId: string | null) {
    const existing = store.get(tokenId);
    if (!existing) return;
    store.set(tokenId, { ...existing, revokedAt, replacedByTokenId });
  },

  async revokeSession(sessionId: string, revokedAt: Date) {
    for (const [id, rec] of store.entries()) {
      if (rec.sessionId === sessionId && rec.revokedAt === null) {
        store.set(id, { ...rec, revokedAt });
      }
    }
  },
};

// test helper (optional): allow clearing between tests
export function __clearRefreshTokenMemoryStore() {
  store.clear();
}
