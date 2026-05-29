import { NextResponse } from "next/server";
import { mockVenues } from "@/lib/marketing-api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = mockVenues.find(v => v.id === id);
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(venue);
}
