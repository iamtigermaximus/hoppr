import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId: id } },
  });
  if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 });

  if (event.maxAttendees) {
    const count = await prisma.eventParticipant.count({ where: { eventId: id } });
    if (count >= event.maxAttendees) {
      return NextResponse.json({ error: "Event is full" }, { status: 409 });
    }
  }

  await prisma.eventParticipant.create({ data: { userId, eventId: id } });

  // Auto-create chat room
  const existingRoom = await prisma.chatRoom.findUnique({ where: { eventId: id } });
  if (!existingRoom) {
    await prisma.chatRoom.create({ data: { eventId: id } });
  }

  // Create notification for event creator
  if (event.creatorId !== userId) {
    const creator = await prisma.user.findUnique({ where: { id: event.creatorId }, select: { username: true } });
    const joiner = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await prisma.notification.create({
      data: {
        type: "JOIN",
        title: "Someone joined your event",
        body: `${joiner?.username || "Someone"} joined "${event.title}"`,
        data: { eventId: event.id, userId },
        userId: event.creatorId,
      },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  await prisma.eventParticipant.deleteMany({
    where: { userId, eventId: id },
  });

  return NextResponse.json({ success: true });
}
