import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { creatorId: params.id },
        { participants: { some: { userId: params.id } } },
      ],
    },
    include: {
      creator: { select: { id: true, username: true, avatarUrl: true } },
      participants: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
    },
    orderBy: { startTime: "desc" },
    take: 30,
  });
  return NextResponse.json(events);
}
