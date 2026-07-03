import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as
      | string
      | undefined;

    const { searchParams } = new URL(req.url);
    const typesParam = searchParams.get("types");
    const types = typesParam ? typesParam.split(",").filter(Boolean) : [];
    const lat = parseFloat(searchParams.get("lat") || "60.1699");
    const lng = parseFloat(searchParams.get("lng") || "24.9384");
    const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 10);
    const excludeFollowed = searchParams.get("excludeFollowed") === "true";

    // Build where clause: match bar types if provided
    const where: any = {
      complianceStatus: { in: ["COMPLIANT", "FLAGGED_AUTO"] },
    };
    if (types.length > 0) {
      where.type = { in: types };
    }

    // Fetch bars
    const bars = await prisma.bar.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        district: true,
        coverImage: true,
        logoUrl: true,
        latitude: true,
        longitude: true,
        qualityScore: true,
      },
      take: 50,
    });

    // Get which bars the current user already follows
    let followedBarIds = new Set<string>();
    if (userId && excludeFollowed) {
      const follows = await prisma.barFollow.findMany({
        where: { userId, barId: { in: bars.map((b) => b.id) } },
        select: { barId: true },
      });
      followedBarIds = new Set(follows.map((f) => f.barId));
    }

    // Compute distance, sort by proximity, then by quality score
    const scored = bars
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        district: b.district,
        image:
          b.coverImage || b.logoUrl || undefined,
        qualityScore: b.qualityScore ?? 0,
        distance:
          b.latitude != null && b.longitude != null
            ? haversineDistance(lat, lng, b.latitude, b.longitude)
            : 99,
        isFollowed: followedBarIds.has(b.id),
      }))
      .filter((b) => !excludeFollowed || !b.isFollowed)
      .sort((a, b) => a.distance - b.distance || b.qualityScore - a.qualityScore)
      .slice(0, limit);

    return NextResponse.json({ bars: scored });
  } catch (error) {
    console.error("bars/suggestions GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
