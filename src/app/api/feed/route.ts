import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance, getTimeFilterWindow } from "@/lib/utils";
import type { FeedItem } from "@/types/feed";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "60.1699");
  const lng = parseFloat(searchParams.get("lng") || "24.9384");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const time = searchParams.get("time") || "today";

  const { start, end } = getTimeFilterWindow(time);

  // 1. Fetch events from DB with participants and venue bar
  const events = await prisma.event.findMany({
    where: { startTime: { gte: start, lte: end } },
    include: {
      participants: {
        include: { user: { select: { id: true, username: true, image: true } } },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Fetch bar coordinates for all event venues in one query
  const eventVenueIds = [...new Set(events.map((e) => e.venueId))];
  const eventBars = await prisma.bar.findMany({
    where: { id: { in: eventVenueIds } },
    select: { id: true, latitude: true, longitude: true },
  });
  const barCoordMap = new Map(eventBars.map((b) => [b.id, { lat: b.latitude, lng: b.longitude }]));

  const eventItems: FeedItem[] = events.map((e) => {
    const coords = barCoordMap.get(e.venueId);
    const distance = coords?.lat != null && coords?.lng != null
      ? haversineDistance(lat, lng, coords.lat, coords.lng)
      : 99;
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
        image: p.user.image,
      })),
    };
  });

  // 2. Fetch promotions from database
  const dbPromotions = await prisma.barPromotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: { bar: { select: { name: true, latitude: true, longitude: true } } },
    orderBy: { startDate: "asc" },
    take: 30,
  });

  const promoItems: FeedItem[] = dbPromotions.map((dbp) => {
    const distance = dbp.bar.latitude != null && dbp.bar.longitude != null
      ? haversineDistance(lat, lng, dbp.bar.latitude, dbp.bar.longitude)
      : 99;
    return {
      type: "promotion" as const,
      id: dbp.id,
      title: dbp.title,
      venueId: dbp.barId,
      venueName: dbp.bar.name,
      description: dbp.description,
      validFrom: dbp.startDate.toISOString(),
      validTo: dbp.endDate.toISOString(),
      distance,
      image: dbp.imageUrl || undefined,
    };
  });

  // 3. Fetch VIP passes from database
  const dbPasses = await prisma.vIPPassEnhanced.findMany({
    where: {
      validityEnd: { gte: new Date() },
    },
    include: { bar: { select: { name: true, latitude: true, longitude: true } } },
    orderBy: { priceCents: "asc" },
    take: 20,
  });

  const passItems: FeedItem[] = dbPasses.map((p) => {
    const distance = p.bar.latitude != null && p.bar.longitude != null
      ? haversineDistance(lat, lng, p.bar.latitude, p.bar.longitude)
      : 99;
    return {
      type: "pass" as const,
      id: p.id,
      title: p.name,
      venueId: p.barId,
      venueName: p.bar.name,
      price: p.priceCents / 100,
      validUntil: p.validityEnd.toISOString(),
      distance,
      imageUrl: undefined,
    };
  });

  // 4. Merge, filter by radius, sort by time
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

  return NextResponse.json(allItems);
}
