import { NextResponse } from "next/server";
import { mockPasses, mockVenues } from "@/lib/marketing-api";
import { haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "60.1699");
  const lng = parseFloat(searchParams.get("lng") || "24.9384");

  const passes = mockPasses.map(p => {
    const venue = mockVenues.find(v => v.id === p.venueId);
    const distance = venue ? haversineDistance(lat, lng, venue.lat, venue.lng) : 99;
    return { ...p, distance };
  });

  return NextResponse.json(passes);
}
