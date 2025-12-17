import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string().optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Optional at first — validated later based on driver
  RESEND_API_KEY: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().optional(),

  PERSISTENCE_DRIVER: z.enum(["memory", "mongo"]).default("memory"),

  REFRESH_TOKEN_PEPPER: z.string().optional(),
});

const isTest = process.env.NODE_ENV === "test";

const parsed = baseSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET ?? (isTest ? "test-secret" : undefined),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000"),

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  PERSISTENCE_DRIVER: process.env.PERSISTENCE_DRIVER,
});

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten());
  throw new Error("Invalid environment variables");
}

const env = parsed.data;

if (env.NODE_ENV === "production") {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required when NODE_ENV='production'");
  }
}

if (env.PERSISTENCE_DRIVER === "mongo") {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required when PERSISTENCE_DRIVER='mongo'");
  }
  if (!env.MONGODB_DB_NAME) {
    throw new Error("MONGODB_DB_NAME is required when PERSISTENCE_DRIVER='mongo'");
  }
}

export const NODE_ENV = env.NODE_ENV;
export const JWT_SECRET = env.JWT_SECRET;
export const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET;
export const APP_URL =
  env.NEXT_PUBLIC_APP_URL ?? (NODE_ENV === "development" ? "http://localhost:3000" : "");

export const RESEND_API_KEY = env.RESEND_API_KEY;

export const PERSISTENCE_DRIVER = env.PERSISTENCE_DRIVER;

export const MONGODB_URI = env.MONGODB_URI;
export const MONGODB_DB_NAME = env.MONGODB_DB_NAME;
export const REFRESH_TOKEN_PEPPER = env.REFRESH_TOKEN_PEPPER;
