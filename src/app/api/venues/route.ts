import { NextResponse } from "next/server";
import { mockVenues } from "@/lib/marketing-api";
import { haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "60.1699");
  const lng = parseFloat(searchParams.get("lng") || "24.9384");
  const type = searchParams.get("type");

  let venues = mockVenues.map(v => ({
    ...v,
    distance: haversineDistance(lat, lng, v.lat, v.lng),
  }));

  if (type) venues = venues.filter(v => v.type === type);
  venues.sort((a, b) => a.distance - b.distance);

  return NextResponse.json(venues);
}
