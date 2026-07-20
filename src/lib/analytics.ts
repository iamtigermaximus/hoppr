// src/lib/analytics.ts
// Crash-proof analytics — collects pebbles, never blocks the page.

type EventType =
  | "PAGE_VIEW" | "BAR_VIEW" | "BAR_DIRECTION" | "BAR_CALL"
  | "BAR_WEBSITE" | "BAR_SHARE" | "PROMO_VIEW" | "PROMO_CLICK"
  | "PROMO_REDEMPTION" | "EVENT_VIEW" | "EVENT_JOIN"
  | "PASS_VIEW" | "PASS_PURCHASE" | "PASS_SCAN"
  | "SEARCH" | "FEED_SCROLL" | "FOLLOW" | "UNFOLLOW"
  | "BRAND_POST_VIEW" | "BRAND_POST_CLICK";

interface AnalyticsEvent {
  type: EventType;
  barId?: string;
  promoId?: string;
  promoName?: string;
  eventId?: string;
  eventTitle?: string;
  passId?: string;
}

// ── In-memory queue ──────────────────────────────────────────

const QUEUE: AnalyticsEvent[] = [];
const FLUSH_MS = 5000;      // flush every 5 seconds
const MAX_BATCH = 50;        // or when queue hits 50
let timer: ReturnType<typeof setTimeout> | null = null;

// ── localStorage recovery (offline resilience) ───────────────

const STORAGE_KEY = "hoppr_analytics";

function drainStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored: AnalyticsEvent[] = JSON.parse(raw);
    if (stored.length === 0) return;
    localStorage.removeItem(STORAGE_KEY);
    QUEUE.push(...stored);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function persistToStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    stored.push(...QUEUE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(-200))); // cap at 200
  } catch { /* storage full or private browsing — silent */ }
}

// ── Flush: sendBeacon → fetch fallback → localStorage last resort ──

async function flush(): Promise<void> {
  if (QUEUE.length === 0) return;
  if (timer) { clearTimeout(timer); timer = null; }

  const batch = QUEUE.splice(0, MAX_BATCH);
  const body = JSON.stringify({ events: batch });

  // 1) sendBeacon — browser guarantees delivery, runs at low priority
  const beaconed = navigator.sendBeacon?.("/api/analytics/events", body);
  if (beaconed) return;

  // 2) fetch with keepalive — works after tab close, older browser fallback
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
    return;
  } catch {
    // 3) Offline — stash in localStorage, retry next page load
    persistToStorage();
  }
}

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(flush, FLUSH_MS);
}

// Drain any events left from a previous crashed/offline session
if (typeof window !== "undefined") {
  drainStorage();
  // Also flush on page unload
  window.addEventListener("beforeunload", flush);
  // Flush when page becomes hidden (tab switch, phone lock)
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

// ── Public API ───────────────────────────────────────────────

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return; // SSR guard
  QUEUE.push(event);
  if (QUEUE.length >= MAX_BATCH) {
    flush();
  } else {
    scheduleFlush();
  }
}
