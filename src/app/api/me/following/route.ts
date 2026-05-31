import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const follows = await prisma.bar_follows.findMany({
    where: { userId },
    include: {
      bars: {
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          district: true,
          coverImage: true,
          imageUrls: true,
          logoUrl: true,
          qualityScore: true,
          cityName: true,
          _count: {
            select: { bar_follows: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const bars = follows.map((f) => ({
    id: f.bars.id,
    name: f.bars.name,
    type: f.bars.type,
    address: f.bars.address,
    district: f.bars.district,
    imageUrl:
      f.bars.coverImage ||
      (f.bars.imageUrls?.length > 0 ? f.bars.imageUrls[0] : null) ||
      f.bars.logoUrl,
    qualityScore: f.bars.qualityScore,
    cityName: f.bars.cityName,
    followerCount: f.bars._count.bar_follows,
    followedAt: f.createdAt.toISOString(),
  }));

  return NextResponse.json({
    following: bars,
    total: bars.length,
  });
}
