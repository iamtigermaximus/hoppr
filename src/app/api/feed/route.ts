import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistance, getTimeFilterWindow } from "@/lib/utils";
import { rankFeed, extractProfile, buildHistory } from "@/lib/feed-ranker";
import type { FeedItem } from "@/types/feed";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "60.1699");
  const lng = parseFloat(searchParams.get("lng") || "24.9384");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const time = searchParams.get("time") || "today";

  const { start, end } = getTimeFilterWindow(time);

  // 1. Optionally authenticate the user for personalization
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Auth is optional — proceed without personalization
  }
  const userId = (session?.user as Record<string, unknown> | undefined)?.id as
    | string
    | undefined;

  // 2. Fetch items from the database (same as before, but also fetch
  //    additional metadata the ranker needs)
  const [events, dbPromotions, dbPasses, userProfile, userHistory] =
    await Promise.all([
      // Events
      prisma.event.findMany({
        where: {
          startTime: { gte: start, lte: end },
          complianceStatus: "COMPLIANT",
        },
        include: {
          participants: {
            include: {
              user: { select: { id: true, username: true, image: true } },
            },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      // Promotions
      prisma.barPromotion.findMany({
        where: {
          isActive: true,
          isApproved: true,
          complianceStatus: "COMPLIANT",
          startDate: { lte: end },
          endDate: { gte: start },
        },
        include: {
          bar: {
            select: { name: true, latitude: true, longitude: true, type: true },
          },
        },
        orderBy: { startDate: "asc" },
        take: 30,
      }),
      // VIP passes
      prisma.vIPPassEnhanced.findMany({
        where: { validityEnd: { gte: new Date() } },
        include: {
          bar: {
            select: { name: true, latitude: true, longitude: true, type: true },
          },
        },
        orderBy: { priceCents: "asc" },
        take: 20,
      }),
      // User profile (for personalization)
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              interests: true,
              drinkPrefs: true,
              languages: true,
            },
          })
        : Promise.resolve(null),
      // User history (for personalization)
      userId
        ? (async () => {
            const [eventsCreated, eventsJoined, passes] = await Promise.all([
              prisma.event.findMany({
                where: { creatorId: userId },
                select: { venueId: true, venueType: true },
                take: 30,
              }),
              prisma.event.findMany({
                where: {
                  participants: { some: { userId } },
                  creatorId: { not: userId },
                },
                select: { venueId: true, venueType: true },
                take: 30,
              }),
              prisma.userVIPPass.findMany({
                where: { userId },
                select: { barId: true },
                take: 20,
              }),
            ]);
            return buildHistory(eventsCreated, eventsJoined, passes);
          })()
        : Promise.resolve(null),
    ]);

  // 3. Build event items with venue coordinates
  const eventVenueIds = [
    ...new Set(events.map((e) => e.venueId)),
  ];
  const eventBars = await prisma.bar.findMany({
    where: { id: { in: eventVenueIds } },
    select: { id: true, latitude: true, longitude: true },
  });
  const barCoordMap = new Map(
    eventBars.map((b) => [b.id, { lat: b.latitude, lng: b.longitude }]),
  );

  const eventItems: FeedItem[] = events.map((e) => {
    const coords = barCoordMap.get(e.venueId);
    const distance =
      coords?.lat != null && coords?.lng != null
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

  // 4. Build promotion items
  const promoItems: FeedItem[] = dbPromotions.map((dbp) => {
    const distance =
      dbp.bar.latitude != null && dbp.bar.longitude != null
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
      accentColor: dbp.accentColor || undefined,
    };
  });

  // 5. Build pass items
  const passItems: FeedItem[] = dbPasses.map((p) => {
    const distance =
      p.bar.latitude != null && p.bar.longitude != null
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

  // 6. Fetch crowd data for all venues in the feed
  const allVenueIds = [
    ...new Set(
      [...eventItems, ...promoItems, ...passItems].map((i) => i.venueId),
    ),
  ];
  const crowdMap = new Map<string, { level: string; reportedAt: string }>();
  if (allVenueIds.length > 0) {
    const crowdReports = await prisma.crowdReport.findMany({
      where: {
        barId: { in: allVenueIds },
        expiresAt: { gte: new Date() },
      },
      select: { barId: true, level: true, reportedAt: true },
      orderBy: { reportedAt: "desc" },
    });
    for (const cr of crowdReports) {
      if (!crowdMap.has(cr.barId)) {
        crowdMap.set(cr.barId, {
          level: cr.level,
          reportedAt: cr.reportedAt.toISOString(),
        });
      }
    }
  }

  // Attach crowd data to each item
  const attachCrowd = <T extends { venueId: string }>(item: T) => {
    const crowd = crowdMap.get(item.venueId);
    return crowd
      ? { ...item, crowdLevel: crowd.level, crowdReportedAt: crowd.reportedAt }
      : item;
  };

  // 7. Merge and filter by radius
  const withinRadius = [
    ...eventItems.map(attachCrowd),
    ...promoItems.map(attachCrowd),
    ...passItems.map(attachCrowd),
  ].filter((item) => item.distance <= radius);

  // 8. Rank with personalization (or chronological fallback)
  const ranked =
    userProfile && userHistory
      ? rankFeed(
          withinRadius,
          extractProfile(userProfile as Record<string, unknown>),
          userHistory,
        )
      : rankFeed(withinRadius, null, null);

  return NextResponse.json(ranked);
}
