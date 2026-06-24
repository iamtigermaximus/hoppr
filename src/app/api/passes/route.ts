import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "60.1699");
    const lng = parseFloat(searchParams.get("lng") || "24.9384");

    const passes = await prisma.vIPPassEnhanced.findMany({
      where: {
        isActive: true,
        validityEnd: { gte: new Date() },
      },
      include: {
        bar: { select: { id: true, name: true, latitude: true, longitude: true } },
      },
      orderBy: { priceCents: "asc" },
      take: 20,
    });

    const result = passes.map((p) => {
      const distance = p.bar.latitude != null && p.bar.longitude != null
        ? haversineDistance(lat, lng, p.bar.latitude, p.bar.longitude)
        : 99;
      return {
        id: p.id,
        venueId: p.bar.id,
        venueName: p.bar.name,
        title: p.name,
        price: p.priceCents / 100,
        type: p.type,
        validUntil: p.validityEnd.toISOString(),
        benefits: p.benefits,
        distance,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("passes GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
