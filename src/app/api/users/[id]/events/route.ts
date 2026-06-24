import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { creatorId: id },
          { participants: { some: { userId: id } } },
        ],
      },
      include: {
        creator: { select: { id: true, username: true, image: true } },
        participants: { include: { user: { select: { id: true, username: true, image: true } } } },
      },
      orderBy: { startTime: "desc" },
      take: 30,
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("users/[id]/events GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
