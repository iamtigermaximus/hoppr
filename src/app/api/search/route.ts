import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const hasLocation = !isNaN(lat) && !isNaN(lng);

    if (!q) {
      return NextResponse.json({ venues: [], events: [], promotions: [] });
    }

    // Run all three queries in parallel
    const [bars, events, promotions] = await Promise.all([
      // --- Bars: search name, district, description ---
      prisma.bar.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { district: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
          district: true,
          latitude: true,
          longitude: true,
          coverImage: true,
          imageUrls: true,
        },
        take: 5,
      }),

      // --- Events: search title, description, venueName (future only, compliant) ---
      prisma.event.findMany({
        where: {
          isActive: true,
          startTime: { gte: new Date() },
          complianceStatus: { in: ["COMPLIANT", "FLAGGED_AUTO"] },
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { venueName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          venueName: true,
          startTime: true,
          imageUrl: true,
          venue: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        take: 5,
      }),

      // --- Promotions: search title, description (active + approved + in date range) ---
      prisma.barPromotion.findMany({
        where: {
          isActive: true,
          isApproved: true,
          complianceStatus: { in: ["COMPLIANT", "FLAGGED_AUTO"] },
          endDate: { gte: new Date() },
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          type: true,
          imageUrl: true,
          bar: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        take: 5,
      }),
    ]);

    const dist = (latField?: number | null, lngField?: number | null) => {
      if (hasLocation && latField != null && lngField != null) {
        return haversineDistance(lat, lng, latField, lngField);
      }
      return null;
    };

    return NextResponse.json({
      venues: bars.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        district: b.district,
        imageUrl: b.coverImage || b.imageUrls?.[0] || null,
        distance: dist(b.latitude, b.longitude),
      })),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        venueName: e.venueName,
        venueId: e.venue.id,
        startTime: e.startTime.toISOString(),
        imageUrl: e.imageUrl,
        distance: dist(e.venue.latitude, e.venue.longitude),
      })),
      promotions: promotions.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        venueName: p.bar.name,
        venueId: p.bar.id,
        imageUrl: p.imageUrl,
        distance: dist(p.bar.latitude, p.bar.longitude),
      })),
    });
  } catch (error) {
    console.error("search GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
