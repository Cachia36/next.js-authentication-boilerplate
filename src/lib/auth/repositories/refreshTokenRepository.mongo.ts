import { ObjectId } from "mongodb";
import type { RefreshTokenRepository, CreateRefreshTokenInput } from "./refreshTokenRepository";
import type { RefreshTokenRecord } from "@/types/refreshToken";
import { getDb } from "@/lib/db/mongoClient";

const COLLECTION = "refreshTokens";

type RefreshTokenDocument = {
  _id?: ObjectId;
  tokenId: string;
  sessionId: string;
  userId: ObjectId;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  lastUsedAt: Date | null;
};

function toRecord(doc: RefreshTokenDocument): RefreshTokenRecord {
  return {
    tokenId: doc.tokenId,
    sessionId: doc.sessionId,
    userId: doc.userId.toString(),
    tokenHash: doc.tokenHash,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt,
    replacedByTokenId: doc.replacedByTokenId,
    lastUsedAt: doc.lastUsedAt,
  };
}

export const mongoRefreshTokenRepository: RefreshTokenRepository = {
  async create(data: CreateRefreshTokenInput) {
    const db = await getDb();
    const doc: RefreshTokenDocument = {
      tokenId: data.tokenId,
      sessionId: data.sessionId,
      userId: new ObjectId(data.userId),
      tokenHash: data.tokenHash,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      revokedAt: data.revokedAt ?? null,
      replacedByTokenId: data.replacedByTokenId ?? null,
      lastUsedAt: data.lastUsedAt ?? null,
    };

    await db.collection<RefreshTokenDocument>(COLLECTION).insertOne(doc);
  },

  async findByTokenId(tokenId: string) {
    const db = await getDb();
    const doc = await db.collection<RefreshTokenDocument>(COLLECTION).findOne({ tokenId });
    return doc ? toRecord(doc) : null;
  },

  async markUsed(tokenId: string, usedAt: Date) {
    const db = await getDb();
    await db
      .collection<RefreshTokenDocument>(COLLECTION)
      .updateOne({ tokenId }, { $set: { lastUsedAt: usedAt } });
  },

  async revokeToken(tokenId: string, revokedAt: Date, replacedByTokenId: string | null) {
    const db = await getDb();
    await db
      .collection<RefreshTokenDocument>(COLLECTION)
      .updateOne({ tokenId }, { $set: { revokedAt, replacedByTokenId } });
  },

  async revokeSession(sessionId: string, revokedAt: Date) {
    const db = await getDb();
    await db
      .collection<RefreshTokenDocument>(COLLECTION)
      .updateMany({ sessionId, revokedAt: null }, { $set: { revokedAt } });
  },
};
