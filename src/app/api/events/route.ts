import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");
  const userId = searchParams.get("userId");

  const where: any = { startTime: { gte: new Date() } };
  if (creatorId) where.creatorId = creatorId;
  if (userId) {
    where.participants = { some: { userId } };
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      creator: { select: { id: true, username: true, avatarUrl: true } },
      participants: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
    },
    orderBy: { startTime: "asc" },
    take: 50,
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, venueId, venueName, venueType, startTime, endTime, maxAttendees, isPrivate } = body;

  if (!title || !venueId || !venueName || !startTime) {
    return NextResponse.json({ error: "Missing required fields: title, venueId, venueName, startTime" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      venueId,
      venueName,
      venueType: venueType || null,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      maxAttendees: maxAttendees || null,
      isPrivate: isPrivate || false,
      creatorId: (session.user as any).id,
    },
    include: {
      creator: { select: { id: true, username: true, avatarUrl: true } },
      participants: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
    },
  });

  return NextResponse.json(event, { status: 201 });
}
