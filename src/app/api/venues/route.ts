import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
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
    },
    orderBy: { name: "asc" },
  });

  const venues = bars.map((b) => ({
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
    capacity: b.capacity,
    amenities: b.amenities,
    hours: b.operatingHours,
    qualityScore: b.qualityScore,
    profileViews: b.profileViews,
    directionClicks: b.directionClicks,
    imageUrl: b.coverImage || (b.imageUrls?.length > 0 ? b.imageUrls[0] : null),
    crowdLevel: b.crowdReports[0]?.level ?? null,
    crowdReportedAt: b.crowdReports[0]?.reportedAt?.toISOString() ?? null,
    distance: b.latitude != null && b.longitude != null
      ? haversineDistance(lat, lng, b.latitude, b.longitude)
      : 99,
  }));

  // Sort by distance
  venues.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));

  return NextResponse.json(venues);
}
