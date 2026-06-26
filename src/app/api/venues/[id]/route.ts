import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Normalize operatingHours from stored format to consumer format.
 *  Business app stores: { Monday: { open:"16:00", close:"02:00" }, ... }
 *  Consumer expects:    { monday: "16:00 - 02:00", ... }             */
function normalizeHours(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const result: Record<string, string> = {};
  for (const day of days) {
    // Already consumer format: "monday": "16:00 - 02:00"
    const lower = src[day];
    if (typeof lower === "string" && lower.length > 0) {
      result[day] = lower;
      continue;
    }
    // Business format: "Monday": { open:"16:00", close:"02:00" }
    const cap = day.charAt(0).toUpperCase() + day.slice(1);
    const capVal = src[cap];
    if (capVal && typeof capVal === "object") {
      const o = (capVal as Record<string,unknown>).open as string | undefined;
      const c = (capVal as Record<string,unknown>).close as string | undefined;
      if (o && c) result[day] = `${o} - ${c}`;
      else result[day] = "Closed";
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as Record<string, unknown>).id as string : null;

    const bar = await prisma.bar.findUnique({
      where: { id },
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
        logoUrl: true,
        isVerified: true,
        qualityScore: true,
        cityName: true,
        crowdReports: {
          where: { expiresAt: { gte: new Date() } },
          orderBy: { reportedAt: "desc" },
          take: 1,
          select: { level: true, reportedAt: true },
        },
        _count: { select: { followers: true } },
      },
    });

    if (!bar) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch promotions for this bar — only approved, compliant, and currently active
    const now = new Date();
    const promotions = await prisma.barPromotion.findMany({
      where: {
        barId: id,
        isActive: true,
        isApproved: true,
        complianceStatus: "COMPLIANT",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        startDate: true,
        endDate: true,
        imageUrl: true,
        accentColor: true,
        redemptions: true,
      },
      orderBy: { startDate: "asc" },
    });

    // Fetch menu items for this bar
    const menuItems = await prisma.menuItem.findMany({
      where: { barId: id, isAvailable: true },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        category: true,
        imageUrl: true,
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    // Fetch VIP passes for this bar
    const passes = await prisma.vIPPassEnhanced.findMany({
      where: {
        barId: id,
        isActive: true,
        validityEnd: { gte: now },
      },
      select: {
        id: true,
        name: true,
        type: true,
        priceCents: true,
        validityEnd: true,
        benefits: true,
      },
      orderBy: { priceCents: "asc" },
    });

    // Check if current user follows this bar
    let isFollowing = false;
    if (userId) {
      const follow = await prisma.barFollow.findUnique({
        where: { userId_barId: { userId, barId: id } },
        select: { id: true },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      id: bar.id,
      name: bar.name,
      type: bar.type,
      address: bar.address,
      lat: bar.latitude,
      lng: bar.longitude,
      district: bar.district,
      phone: bar.phone,
      website: bar.website,
      email: bar.email,
      instagram: bar.instagram,
      facebook: bar.facebook,
      description: bar.description,
      priceRange: bar.priceRange,
      coverCharge: bar.coverCharge,
      musicTags: bar.musicTags,
      capacity: bar.capacity,
      amenities: bar.amenities,
      hours: normalizeHours(bar.operatingHours),
      imageUrl: bar.coverImage || (bar.imageUrls?.length > 0 ? bar.imageUrls[0] : null),
      imageUrls: bar.imageUrls,
      logoUrl: bar.logoUrl,
      isVerified: bar.isVerified,
      qualityScore: bar.qualityScore,
      cityName: bar.cityName,
      followerCount: bar._count.followers,
      isFollowing,
      crowdLevel: bar.crowdReports[0]?.level ?? null,
      crowdReportedAt: bar.crowdReports[0]?.reportedAt?.toISOString() ?? null,
      promotions: promotions.map((p) => ({
        id: p.id,
        venueId: bar.id,
        venueName: bar.name,
        title: p.title,
        description: p.description,
        type: p.type,
        validFrom: p.startDate.toISOString(),
        validTo: p.endDate.toISOString(),
        imageUrl: p.imageUrl,
        accentColor: p.accentColor,
        redemptions: p.redemptions,
      })),
      passes: passes.map((p) => ({
        id: p.id,
        venueId: bar.id,
        venueName: bar.name,
        title: p.name,
        price: p.priceCents / 100,
        type: p.type,
        validUntil: p.validityEnd.toISOString(),
        benefits: p.benefits,
      })),
      menu: menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.priceCents / 100,
        category: item.category,
        imageUrl: item.imageUrl,
      })),
    });
  } catch (error) {
    console.error("venues/[id] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
