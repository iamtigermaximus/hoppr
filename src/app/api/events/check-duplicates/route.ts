import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findDuplicates } from "@/lib/duplicate-detector";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const venueId = searchParams.get("venueId");

  if (!title || !venueId) {
    return NextResponse.json(
      { error: "title and venueId required" },
      { status: 400 },
    );
  }

  const recentEvents = await prisma.event.findMany({
    where: {
      venueId: { not: venueId },
      startTime: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      title: true,
      description: true,
      venueId: true,
      venueName: true,
    },
    take: 50,
  });

  const result = findDuplicates(title, description, recentEvents, venueId);

  return NextResponse.json(result);
}
