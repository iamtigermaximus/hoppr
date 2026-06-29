import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/utils";

function placeholderHours(): Record<string, string> {
  // Reasonable defaults for bars without stored hours.
  // Can be updated as needed.
  return {
    monday: "16:00 - 02:00",
    tuesday: "16:00 - 02:00",
    wednesday: "16:00 - 02:00",
    thursday: "16:00 - 02:00",
    friday: "16:00 - 04:00",
    saturday: "16:00 - 04:00",
    sunday: "16:00 - 02:00",
  };
}

function normalizeHours(raw: unknown): { hours: Record<string, string>; isPlaceholder: boolean } {
  const ph = () => ({ hours: placeholderHours(), isPlaceholder: true });
  if (!raw) return ph();
  let src: Record<string, unknown>;
  if (typeof raw === "string") {
    try { src = JSON.parse(raw); } catch { return ph(); }
  } else if (typeof raw === "object") {
    src = raw as Record<string, unknown>;
  } else {
    return ph();
  }
  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const result: Record<string, string> = {};
  for (const day of days) {
    const cap = day.charAt(0).toUpperCase() + day.slice(1);

    // Try lowercase key first
    const lower = src[day];
    if (lower) {
      if (typeof lower === "string" && lower.length > 0) { result[day] = lower; continue; }
      if (typeof lower === "object" && lower !== null) {
        const lo = (lower as Record<string,unknown>).open as string | undefined;
        const lc = (lower as Record<string,unknown>).close as string | undefined;
        if (lo && lc && lo !== "Closed" && lc !== "Closed") {
          result[day] = `${lo} - ${lc}`;
        } else {
          result[day] = "Closed";
        }
        continue;
      }
    }

    // Try capitalized key
    const capVal = src[cap];
    if (capVal) {
      if (typeof capVal === "string" && capVal.length > 0) { result[day] = capVal; continue; }
      if (typeof capVal === "object") {
        const o = (capVal as Record<string,unknown>).open as string | undefined;
        const c = (capVal as Record<string,unknown>).close as string | undefined;
        if (o && c && o !== "Closed" && c !== "Closed") {
          result[day] = `${o} - ${c}`;
        } else {
          result[day] = "Closed";
        }
      }
    }
  }
  // If every day is "Closed", the data was never entered — use placeholder
  const allClosed = Object.keys(result).length === 7 &&
    Object.values(result).every((v) => v === "Closed");
  if (Object.keys(result).length > 0 && !allClosed) {
    return { hours: result, isPlaceholder: false };
  }
  return ph();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "60.1699");
    const lng = parseFloat(searchParams.get("lng") || "24.9384");
    const type = searchParams.get("type");
    const search = searchParams.get("search") || "";

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
      ];
    }

    const bars = await prisma.bar.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        district: true,
        latitude: true,
        longitude: true,
        phone: true,
        website: true,
        email: true,
        instagram: true,
        facebook: true,
        description: true,
        priceRange: true,
        coverCharge: true,
        musicTags: true,
        capacity: true,
        amenities: true,
        operatingHours: true,
        coverImage: true,
        imageUrls: true,
        isActive: true,
        isVerified: true,
        qualityScore: true,
        profileViews: true,
        directionClicks: true,
        crowdReports: {
          where: { expiresAt: { gte: new Date() } },
          orderBy: { reportedAt: "desc" },
          take: 1,
          select: { level: true, reportedAt: true },
        },
        _count: { select: { followers: true } },
      },
      orderBy: { name: "asc" },
    });

    const venues = bars.map((b) => {
      const nh = normalizeHours(b.operatingHours);
      return {
        id: b.id,
        name: b.name,
        type: b.type,
        address: b.address,
        lat: b.latitude,
        lng: b.longitude,
        district: b.district,
        phone: b.phone,
        website: b.website,
        email: b.email,
        instagram: b.instagram,
        facebook: b.facebook,
        description: b.description,
        priceRange: b.priceRange,
        coverCharge: b.coverCharge,
        musicTags: b.musicTags,
        capacity: b.capacity,
        amenities: b.amenities,
        hours: nh.hours,
        hoursArePlaceholder: nh.isPlaceholder,
        qualityScore: b.qualityScore,
        profileViews: b.profileViews,
        directionClicks: b.directionClicks,
        followerCount: b._count.followers,
        imageUrl: b.coverImage || (b.imageUrls?.length > 0 ? b.imageUrls[0] : null),
        crowdLevel: b.crowdReports[0]?.level ?? null,
        crowdReportedAt: b.crowdReports[0]?.reportedAt?.toISOString() ?? null,
        distance: b.latitude != null && b.longitude != null
          ? haversineDistance(lat, lng, b.latitude, b.longitude)
          : 99,
      };
    });

    // Sort by distance
    venues.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));

    return NextResponse.json(venues);
  } catch (error) {
    console.error("venues GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
