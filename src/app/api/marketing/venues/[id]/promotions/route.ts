import { NextResponse } from "next/server";
import { mockPromotions } from "@/lib/marketing-api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const promotions = mockPromotions.filter(p => p.venueId === params.id);
  return NextResponse.json(promotions);
}
