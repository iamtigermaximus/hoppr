import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockPromotions, mockPasses, mockVenues } from "@/lib/marketing-api";
import { haversineDistance, getTimeFilterWindow } from "@/lib/utils";
import type { FeedItem } from "@/types/feed";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "60.1699");
  const lng = parseFloat(searchParams.get("lng") || "24.9384");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const time = searchParams.get("time") || "today";

  const { start, end } = getTimeFilterWindow(time);

  // 1. Fetch events from DB within time window
  const events = await prisma.event.findMany({
    where: { startTime: { gte: start, lte: end } },
    include: {
      participants: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // 2. Map events to FeedItems with distance
  const eventItems: FeedItem[] = events.map((e) => {
    const venue = mockVenues.find((v) => v.id === e.venueId);
    const distance = venue ? haversineDistance(lat, lng, venue.lat, venue.lng) : 99;
    return {
      type: "event" as const,
      id: e.id,
      title: e.title,
      venueId: e.venueId,
      venueName: e.venueName,
      venueType: e.venueType || undefined,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString(),
      attendeeCount: e.participants.length,
      distance,
      image: e.imageUrl || undefined,
      attendees: e.participants.map((p) => ({
        id: p.user.id,
        name: p.user.username,
        image: p.user.avatarUrl,
      })),
    };
  });

  // 3. Fetch promotions (mock) and map
  const promoItems: FeedItem[] = mockPromotions.map((p) => {
    const venue = mockVenues.find((v) => v.id === p.venueId);
    const distance = venue ? haversineDistance(lat, lng, venue.lat, venue.lng) : 99;
    return {
      ...p,
      type: "promotion" as const,
      distance,
    };
  });

  // 4. Fetch promotions from shared database (business-created promos)
  const mockPromoKeys = new Set(mockPromotions.map((p) => `${p.title}|${p.venueName}`));

  const dbPromotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: { bar: true },
    orderBy: { startDate: "asc" },
    take: 20,
  });

  for (const dbp of dbPromotions) {
    const key = `${dbp.title}|${dbp.bar.name}`;
    if (mockPromoKeys.has(key)) continue; // deduplicate by title + venue name

    const distance = haversineDistance(lat, lng, dbp.bar.latitude, dbp.bar.longitude);

    promoItems.push({
      type: "promotion" as const,
      id: dbp.id,
      title: dbp.title,
      venueId: dbp.barId,
      venueName: dbp.bar.name,
      description: dbp.description || "",
      validFrom: dbp.startDate.toISOString(),
      validTo: dbp.endDate.toISOString(),
      distance,
      image: dbp.imageUrl || undefined,
    });
  }

  // 5. Fetch passes (mock) and map
  const passItems: FeedItem[] = mockPasses.map((p) => {
    const venue = mockVenues.find((v) => v.id === p.venueId);
    const distance = venue ? haversineDistance(lat, lng, venue.lat, venue.lng) : 99;
    return {
      ...p,
      type: "pass" as const,
      distance,
    };
  });

  // 6. Merge, filter by radius, sort by time
  const allItems = [...eventItems, ...promoItems, ...passItems]
    .filter((item) => item.distance <= radius)
    .sort((a, b) => {
      const aTime =
        a.type === "event"
          ? new Date(a.startTime).getTime()
          : a.type === "promotion"
            ? new Date(a.validFrom).getTime()
            : new Date(a.validUntil).getTime();
      const bTime =
        b.type === "event"
          ? new Date(b.startTime).getTime()
          : b.type === "promotion"
            ? new Date(b.validFrom).getTime()
            : new Date(b.validUntil).getTime();
      return aTime - bTime;
    });

  // Boost promoted items with priority > 1 to the top while preserving relative order
  const sorted = [...allItems].sort((a, b) => {
    const aBoost = a.type === "promotion" && (a as any).priority > 1;
    const bBoost = b.type === "promotion" && (b as any).priority > 1;
    if (aBoost && !bBoost) return -1;
    if (!aBoost && bBoost) return 1;
    return 0;
  });

  return NextResponse.json(sorted);
}
