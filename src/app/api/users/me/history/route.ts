import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const [eventsCreated, eventsJoined, passes] = await Promise.all([
    prisma.event.findMany({
      where: { creatorId: userId },
      include: {
        participants: { include: { user: { select: { id: true, username: true, image: true } } } },
      },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
    prisma.event.findMany({
      where: { participants: { some: { userId } }, creatorId: { not: userId } },
      include: {
        creator: { select: { id: true, username: true, image: true } },
        participants: { include: { user: { select: { id: true, username: true, image: true } } } },
      },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
    prisma.userVIPPass.findMany({
      where: { userId },
      include: {
        vipPass: { select: { name: true, type: true } },
        bar: { select: { name: true } },
      },
      orderBy: { purchasedAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ eventsCreated, eventsJoined, passes });
}
