import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  try {
    const now = new Date();

    const campaigns = await prisma.adCampaign.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        complianceStatus: { in: ["COMPLIANT", "FLAGGED_AUTO"] },
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
  } catch (error) {
    console.error("campaigns GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
