/**
 * Rate limiter — Redis-backed with in-memory fallback.
 *
 * Primary: Upstash Redis (HTTP-based, spans all serverless instances).
 * Degraded: In-memory Map (per-instance, resets on restart).
 */

import { redis } from "@/lib/redis";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();
const keyWindows = new Map<string, number>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > (keyWindows.get(key) ?? 60) * 1000 * 2) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer !== "undefined" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

function checkMemory(
  key: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfter: number } {
  ensureCleanup();
  keyWindows.set(key, config.windowSeconds);

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const existing = store.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfter = Math.ceil(
      (existing.windowStart + windowMs - now) / 1000,
    );
    return { allowed: false, retryAfter };
  }

  existing.count++;
  return { allowed: true };
}

async function checkRedis(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  if (!redis) throw new Error("Redis not available");

  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, config.windowSeconds);
  }

  if (count > config.maxRequests) {
    const ttl = await redis.ttl(redisKey);
    return { allowed: false, retryAfter: ttl > 0 ? ttl : config.windowSeconds };
  }

  return { allowed: true };
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  if (redis) {
    try {
      return await checkRedis(key, config);
    } catch (err) {
      console.warn(`[rate-limiter] Redis unavailable, falling back to in-memory: ${(err as Error)?.message}`);
    }
  }

  return checkMemory(key, config);
}

export const RateLimits = {
  /** Auth endpoints: 5 attempts per minute */
  AUTH: { windowSeconds: 60, maxRequests: 5 } as RateLimitConfig,
  /** Content creation: 10 per minute */
  CREATE: { windowSeconds: 60, maxRequests: 10 } as RateLimitConfig,
  /** Join/participate actions: 20 per minute */
  ACTION: { windowSeconds: 60, maxRequests: 20 } as RateLimitConfig,
  /** Purchase: 5 per minute */
  PURCHASE: { windowSeconds: 60, maxRequests: 5 } as RateLimitConfig,
} as const;
