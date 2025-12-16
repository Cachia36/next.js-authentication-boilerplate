import { jwtVerify } from "jose";
import type { AuthTokenPayload } from "@/types/auth";

const encoder = new TextEncoder();

// JWT_SECRET should be a string. jose needs Uint8Array
const accessSecret = encoder.encode(process.env.JWT_SECRET!);

export async function verifyAccessTokenEdge(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as AuthTokenPayload;
}
