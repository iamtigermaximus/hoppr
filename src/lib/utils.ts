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
    default: return { now, start: today, end: new Date(today.getTime() + 86400000 * 7) };
  }
}
