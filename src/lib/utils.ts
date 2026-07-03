export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatEventTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ${time}`;
}

export function getTimeFilterWindow(filter: string): { now: Date; start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case "now": return { now, start: new Date(now.getTime() - 3600000), end: new Date(now.getTime() + 3600000) };
    case "today": return { now, start: today, end: new Date(today.getTime() + 86400000) };
    case "tomorrow": return { now, start: new Date(today.getTime() + 86400000), end: new Date(today.getTime() + 172800000) };
    case "afternoon": return { now, start: new Date(today.getTime() + 12 * 3600000), end: new Date(today.getTime() + 17 * 3600000) };
    case "evening": return { now, start: new Date(today.getTime() + 17 * 3600000), end: new Date(today.getTime() + 22 * 3600000) };
    case "night": return { now, start: new Date(today.getTime() + 22 * 3600000), end: new Date(today.getTime() + 28 * 3600000) };
    case "week": return { now, start: today, end: new Date(today.getTime() + 86400000 * 7) };
    case "month": return { now, start: today, end: new Date(today.getTime() + 86400000 * 30) };
    case "all": return { now, start: today, end: new Date(today.getTime() + 86400000 * 365) };
    default: return { now, start: today, end: new Date(today.getTime() + 86400000 * 7) };
  }
}

/**
 * Parse a time string like "16:00", "4:00 PM", "02:00" into minutes since midnight.
 * Returns -1 if the string cannot be parsed.
 */
export function parseTimeStr(s: unknown): number {
  if (typeof s !== "string") return -1;
  const match = s.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  if (!match) return -1;
  let hour = parseInt(match[1]);
  const min = match[2] ? parseInt(match[2]) : 0;
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return hour * 60 + min;
}

/**
 * Determine whether a venue is currently open based on its operating hours JSON.
 * The `hours` object is of the shape { Monday: { open: "16:00", close: "02:00" }, ... }
 * Returns null if unknown, true if open, false if closed.
 */
export function isVenueOpen(hours?: Record<string, unknown> | null): boolean | null {
  if (!hours) return null; // unknown — no data
  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const entry = hours[today];
  if (!entry) return null; // no entry for today — unknown

  // Handle object format: { open: "16:00", close: "02:00" }
  if (typeof entry === "object" && entry !== null && !Array.isArray(entry)) {
    const obj = entry as Record<string, unknown>;
    if (!obj.open || !obj.close) return null;
    const openMin = parseTimeStr(obj.open);
    let closeMin = parseTimeStr(obj.close);
    if (openMin < 0 || closeMin < 0) return null;
    if (closeMin < openMin) closeMin += 24 * 60;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin >= openMin && nowMin < closeMin;
  }

  // Handle string format: "16:00 – 02:00" or "Closed"
  const timeStr = String(entry);
  if (timeStr === "Closed" || timeStr === "closed" || timeStr === "Suljettu" || timeStr === "Kiinni") return false;

  const parts = timeStr.split(/[–\-]/).map(s => s.trim());
  if (parts.length !== 2) return null;

  const openMin = parseTimeStr(parts[0]);
  let closeMin = parseTimeStr(parts[1]);
  if (openMin < 0 || closeMin < 0) return null;
  if (closeMin < openMin) closeMin += 24 * 60;
  const nowMin2 = now.getHours() * 60 + now.getMinutes();

  return nowMin2 >= openMin && nowMin2 < closeMin;
}

const PRICE_RANGE_LABELS: Record<string, string> = {
  BUDGET: "€",
  MODERATE: "€€",
  PREMIUM: "€€€",
  LUXURY: "€€€€",
};

export function formatPriceRange(priceRange?: string | null): string | null {
  if (!priceRange) return null;
  return PRICE_RANGE_LABELS[priceRange] ?? priceRange;
}

/** Returns a countdown string if promo ends within 24 hours, otherwise null. */
export function formatPromoCountdown(validTo: string): string | null {
  const now = Date.now();
  const end = new Date(validTo).getTime();
  const remaining = end - now;
  if (remaining <= 0) return null;
  if (remaining > 24 * 60 * 60 * 1000) return null;
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  if (hours >= 1) return `Ends in ${hours}h`;
  const minutes = Math.floor(remaining / (60 * 1000));
  if (minutes >= 1) return `Ends in ${minutes}m`;
  return "Ending now";
}
