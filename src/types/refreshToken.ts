export type RefreshTokenJwtPayload = {
  sub: string; // user id
  sid: string; // session/family id
  jti: string; // token id
  typ: "refresh";
  iat?: number;
  exp?: number;
};

export type RefreshTokenRecord = {
  tokenId: string; // jti
  sessionId: string; // sid
  userId: string; // sub
  tokenHash: string; // sha256(token + pepper)
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  lastUsedAt: Date | null;
};
