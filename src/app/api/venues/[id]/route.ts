import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
      capacity: true,
      amenities: true,
      operatingHours: true,
      coverImage: true,
      imageUrls: true,
      logoUrl: true,
      isVerified: true,
      qualityScore: true,
      cityName: true,
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
    },
    orderBy: { startDate: "asc" },
  });

  // Fetch VIP passes for this bar
  const passes = await prisma.vIPPassEnhanced.findMany({
    where: {
      barId: id,
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
    capacity: bar.capacity,
    amenities: bar.amenities,
    hours: bar.operatingHours,
    imageUrl: bar.coverImage || (bar.imageUrls?.length > 0 ? bar.imageUrls[0] : null),
    imageUrls: bar.imageUrls,
    logoUrl: bar.logoUrl,
    isVerified: bar.isVerified,
    qualityScore: bar.qualityScore,
    cityName: bar.cityName,
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
  });
}
