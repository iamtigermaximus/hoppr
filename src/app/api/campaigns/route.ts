import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  const now = new Date();

  const campaigns = await prisma.adCampaign.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      complianceStatus: "COMPLIANT",
    },
    select: {
      id: true,
      barId: true,
      title: true,
      description: true,
      type: true,
      budgetCents: true,
      imageUrl: true,
      targetUrl: true,
      promotedItemId: true,
      bar: {
        select: {
          name: true,
          type: true,
          district: true,
          coverImage: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: { budgetCents: "desc" },
  });

  return NextResponse.json(campaigns);
}
