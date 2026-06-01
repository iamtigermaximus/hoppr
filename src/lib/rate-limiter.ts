/**
 * In-memory rate limiter with configurable window and max requests.
 * Uses a sliding window per key (typically userId:endpoint).
 * Stale entries are cleaned on each check.
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > entryWindow(key) * 1000 * 2) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer !== "undefined" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

// Track per-key window durations for cleanup
const keyWindows = new Map<string, number>();

function entryWindow(key: string): number {
  return keyWindows.get(key) ?? 60;
}

export interface RateLimitConfig {
  /** The time window in seconds */
  windowSeconds: number;
  /** Maximum requests allowed within the window */
  maxRequests: number;
}

/**
 * Check if a request should be rate limited.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfter: number } {
  ensureCleanup();
  keyWindows.set(key, config.windowSeconds);

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const existing = store.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    // New window
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

/**
 * Rate limit presets for common use cases.
 */
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
