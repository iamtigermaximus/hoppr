import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const rooms = await prisma.eventChatRoom.findMany({
      where: {
        event: { participants: { some: { userId } } },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            venueName: true,
            participants: {
              where: { userId },
              select: { lastReadAt: true },
            },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    // Compute unread counts and attach them
    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const lastReadAt = room.event.participants[0]?.lastReadAt ?? null;
        let unreadCount = 0;

        if (lastReadAt) {
          unreadCount = await prisma.eventChatMessage.count({
            where: { roomId: room.id, createdAt: { gt: lastReadAt } },
          });
        } else {
          // User has never opened this chat — all messages are unread
          unreadCount = room._count.messages;
        }

        // Strip the nested participant from the response
        const { participants, ...eventRest } = room.event;

        return {
          id: room.id,
          eventId: room.eventId,
          createdAt: room.createdAt,
          event: eventRest,
          messages: room.messages,
          unreadCount,
        };
      })
    );

    // Sort by latest message timestamp so active chats float to the top
    enriched.sort((a, b) => {
      const aTime = a.messages[0]?.createdAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.messages[0]?.createdAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("chat/my-chats GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
