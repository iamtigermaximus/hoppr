import { NextResponse } from "next/server";
import { mockPromotions } from "@/lib/marketing-api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promotions = mockPromotions.filter(p => p.venueId === id);
  return NextResponse.json(promotions);
}
