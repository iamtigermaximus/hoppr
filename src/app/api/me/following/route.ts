import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const follows = await prisma.barFollow.findMany({
      where: { userId },
      include: {
        bar: {
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
              select: { followers: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const bars = follows.map((f) => ({
      id: f.bar.id,
      name: f.bar.name,
      type: f.bar.type,
      address: f.bar.address,
      district: f.bar.district,
      imageUrl:
        f.bar.coverImage ||
        (f.bar.imageUrls?.length > 0 ? f.bar.imageUrls[0] : null) ||
        f.bar.logoUrl,
      qualityScore: f.bar.qualityScore,
      cityName: f.bar.cityName,
      followerCount: f.bar._count.followers,
      followedAt: f.createdAt.toISOString(),
    }));

    return NextResponse.json({
      following: bars,
      total: bars.length,
    });
  } catch (error) {
    console.error("me/following GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
