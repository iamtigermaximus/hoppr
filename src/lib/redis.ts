// src/lib/redis.ts
// Upstash Redis client singleton (HTTP-based, serverless-safe, no persistent TCP).
// Falls back to null if env vars are not set — the rate limiter degrades
// gracefully to in-memory mode.

import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiter will use in-memory fallback");
    }
    return null;
  }

  return new Redis({ url, token });
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
