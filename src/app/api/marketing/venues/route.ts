import { NextResponse } from "next/server";
import { mockVenues } from "@/lib/marketing-api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "60.1699");
  const lng = parseFloat(searchParams.get("lng") || "24.9384");
  const type = searchParams.get("type");

  let venues = [...mockVenues];

  // Filter by type if specified
  if (type) {
    venues = venues.filter(v => v.type === type);
  }

  // Only drinking establishments (exclude restaurants/cafes — already filtered in mock data)
  const drinkingTypes = ["PUB", "CLUB", "COCKTAIL_LOUNGE", "SPORTS_BAR", "KARAOKE_BAR", "WINE_BAR", "BREWERY_TAPROOM", "LIVE_MUSIC"];
  venues = venues.filter(v => drinkingTypes.includes(v.type));

  return NextResponse.json(venues);
}
