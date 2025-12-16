// src/lib/auth/server/getServerSession.ts
import { cookies } from "next/headers";
import type { User } from "@/types/user";
import { verifyAccessToken } from "@/lib/auth/domain/jwtService";
import type { AuthTokenPayload } from "@/types/auth";

function payloadToUser(p: AuthTokenPayload): User {
  return {
    id: p.sub,
    email: p.email,
    role: p.role,
    createdAt: p.createdAt,
  };
}

export async function getServerSession(): Promise<{ user: User | null }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) return { user: null };

  try {
    const payload = verifyAccessToken(accessToken) as AuthTokenPayload;
    return { user: payloadToUser(payload) };
  } catch {
    return { user: null };
  }
}
