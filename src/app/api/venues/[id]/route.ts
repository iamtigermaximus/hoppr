import { NextResponse } from "next/server";
import { mockVenues, mockPromotions, mockPasses } from "@/lib/marketing-api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = mockVenues.find(v => v.id === id);
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const promotions = mockPromotions.filter(p => p.venueId === id);
  const passes = mockPasses.filter(p => p.venueId === id);

  return NextResponse.json({ ...venue, promotions, passes });
}
