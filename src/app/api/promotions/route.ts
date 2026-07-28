import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "60.1699");
    const lng = parseFloat(searchParams.get("lng") || "24.9384");
    const id = searchParams.get("id");

    const where: any = {
      isActive: true,
    };

    // Public listing: only show approved, compliant, active-date-range promotions
    if (!id) {
      where.isApproved = true;
      where.complianceStatus = { in: ["COMPLIANT", "FLAGGED_AUTO"] };
      where.endDate = { gte: new Date() };
    } else {
      // Direct access by ID: relax filters so bar owners can preview their own
      // content even if not yet approved or date hasn't started
      where.id = id;
    }

    const promotions = await prisma.barPromotion.findMany({
      where,
      include: {
        bar: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
      },
      orderBy: [{ priority: "desc" }, { startDate: "asc" }],
      take: id ? 1 : 20,
    });

    const result = promotions.map((p) => {
      const distance = p.bar.latitude != null && p.bar.longitude != null
        ? haversineDistance(lat, lng, p.bar.latitude, p.bar.longitude)
        : 99;
      return {
        id: p.id,
        venueId: p.bar.id,
        venueName: p.bar.name,
        venueAddress: p.bar.address,
        title: p.title,
        description: p.description,
        type: p.type,
        discount: p.discount,
        conditions: p.conditions,
        benefits: p.benefits,
        validFrom: p.startDate.toISOString(),
        validTo: p.endDate.toISOString(),
        validDays: p.validDays,
        validHours: p.validHours,
        redemptionRule: p.redemptionRule,
        maxRedemptions: p.maxRedemptions,
        redemptions: p.redemptions,
        imageUrl: p.imageUrl,
        accentColor: p.accentColor,
        priority: p.priority,
        distance,
        venueLat: p.bar.latitude,
        venueLng: p.bar.longitude,
      };
    });

    if (id) {
      if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(result[0]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("promotions GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
