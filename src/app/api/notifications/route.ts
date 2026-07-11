import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor"); // ISO date string

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1, // fetch one extra to detect hasMore
    });

    const hasMore = notifications.length > PAGE_SIZE;
    if (hasMore) notifications.pop();

    const nextCursor =
      hasMore && notifications.length > 0
        ? notifications[notifications.length - 1].createdAt.toISOString()
        : null;

    return NextResponse.json({ notifications, nextCursor });
  } catch (error) {
    console.error("notifications GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearRead = searchParams.get("clearRead");

    if (id) {
      // Delete a single notification — must belong to this user
      await prisma.notification.deleteMany({ where: { id, userId } });
      return NextResponse.json({ success: true });
    }

    if (clearRead === "true") {
      // Delete all read notifications for this user
      await prisma.notification.deleteMany({ where: { userId, read: true } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Pass ?id= or ?clearRead=true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("notifications DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
