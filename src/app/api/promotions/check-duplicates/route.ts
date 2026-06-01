import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findDuplicates } from "@/lib/duplicate-detector";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const barId = searchParams.get("barId");

  if (!title || !barId) {
    return NextResponse.json(
      { error: "title and barId required" },
      { status: 400 },
    );
  }

  const recentPromos = await prisma.barPromotion.findMany({
    where: {
      barId: { not: barId },
      endDate: { gte: new Date() },
    },
    select: {
      id: true,
      title: true,
      description: true,
      barId: true,
      bar: { select: { name: true } },
    },
    take: 50,
  });

  const candidates = recentPromos.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    venueId: p.barId,
    venueName: p.bar.name,
  }));

  const result = findDuplicates(title, description, candidates, barId);

  return NextResponse.json(result);
}
