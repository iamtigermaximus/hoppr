import { NextResponse } from "next/server";
import { mockVenues, mockPromotions, mockPasses } from "@/lib/marketing-api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const venue = mockVenues.find(v => v.id === params.id);
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const promotions = mockPromotions.filter(p => p.venueId === params.id);
  const passes = mockPasses.filter(p => p.venueId === params.id);

  return NextResponse.json({ ...venue, promotions, passes });
}
