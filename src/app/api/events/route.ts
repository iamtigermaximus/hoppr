import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");
  const userId = searchParams.get("userId");

  const where: any = {
    startTime: { gte: new Date() },
    complianceStatus: "COMPLIANT",
  };
  if (creatorId) where.creatorId = creatorId;
  if (userId) {
    where.OR = [
      { participants: { some: { userId } } },
      { creatorId: userId },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      creator: { select: { id: true, username: true, image: true } },
      participants: {
        include: { user: { select: { id: true, username: true, image: true } } },
      },
      crawlStops: { orderBy: { order: "asc" } },
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
  const { title, description, venueId, venueName, venueType, startTime, endTime, maxAttendees, isPrivate, imageUrl, crawlStops } = body;

  if (!title || !venueId || !venueName || !startTime) {
    return NextResponse.json({ error: "Missing required fields: title, venueId, venueName, startTime" }, { status: 400 });
  }

  const creatorId = (session.user as any).id;

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
      imageUrl: imageUrl || null,
      creatorId,
      // Auto-join the creator as a participant
      participants: {
        create: { userId: creatorId },
      },
      // Persist crawl stops if provided
      ...(crawlStops && crawlStops.length > 0
        ? {
            crawlStops: {
              create: crawlStops.map((stop: any, i: number) => ({
                venueId: stop.id || stop.venueId,
                venueName: stop.name || stop.venueName || `Stop ${i + 1}`,
                venueType: stop.type || stop.venueType || null,
                order: i,
                arriveAt: stop.arriveAt ? new Date(stop.arriveAt) : undefined,
                leaveAt: stop.leaveAt ? new Date(stop.leaveAt) : undefined,
              })),
            },
          }
        : {}),
    },
    include: {
      creator: { select: { id: true, username: true, image: true } },
      participants: {
        include: { user: { select: { id: true, username: true, image: true } } },
      },
      crawlStops: { orderBy: { order: "asc" } },
    },
  });

  // Auto-create chat room
  await prisma.eventChatRoom.create({ data: { eventId: event.id } });

  return NextResponse.json(event, { status: 201 });
}
