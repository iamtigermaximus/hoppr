import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface PresenceEntry {
  userId: string;
  lat: number;
  lng: number;
  venueId: string | null;
  timestamp: number;
}

const presenceStore = new Map<string, PresenceEntry>();
const PRESENCE_TTL_MS = 15 * 60 * 1000;

function cleanupStale() {
  const now = Date.now();
  for (const [userId, entry] of presenceStore) {
    if (now - entry.timestamp > PRESENCE_TTL_MS) {
      presenceStore.delete(userId);
    }
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { lat, lng, venueId } = body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "lat and lng required" },
      { status: 400 },
    );
  }

  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;

  presenceStore.set(userId, {
    userId,
    lat: roundedLat,
    lng: roundedLng,
    venueId: venueId ?? null,
    timestamp: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  presenceStore.delete(userId);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  cleanupStale();

  const venueCounts = new Map<string, number>();
  let unassignedCount = 0;

  for (const [, entry] of presenceStore) {
    if (entry.venueId) {
      venueCounts.set(entry.venueId, (venueCounts.get(entry.venueId) || 0) + 1);
    } else {
      unassignedCount++;
    }
  }

  return NextResponse.json({
    totalPresent: presenceStore.size,
    unassigned: unassignedCount,
    byVenue: Object.fromEntries(venueCounts),
  });
}
