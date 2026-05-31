import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const rooms = await prisma.eventChatRoom.findMany({
    where: {
      event: { participants: { some: { userId } } },
    },
    include: {
      event: {
        select: { id: true, title: true, venueName: true },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(rooms);
}
