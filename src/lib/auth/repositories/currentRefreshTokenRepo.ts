import type { RefreshTokenRepository } from "./refreshTokenRepository";
import { memoryRefreshTokenRepository } from "./refreshTokenRepository.memory";
import { mongoRefreshTokenRepository } from "./refreshTokenRepository.mongo";
import { PERSISTENCE_DRIVER } from "@/lib/core/env";

const driver = PERSISTENCE_DRIVER ?? "memory";

export const refreshTokenRepo: RefreshTokenRepository =
  driver === "mongo" ? mongoRefreshTokenRepository : memoryRefreshTokenRepository;
