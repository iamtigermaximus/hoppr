// POST /api/notifications/mark-opened
// Called by the consumer app when a user taps a push notification.
// Updates the notification log status to "opened" and records the timestamp.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await request.json();
    const { fcmMessageId } = body;

    if (!fcmMessageId) {
      return NextResponse.json(
        { error: "fcmMessageId is required" },
        { status: 400 },
      );
    }

    // Update all logs with this message ID that are still "sent"
    const updated = await prisma.notificationLog.updateMany({
      where: {
        fcmMessageId,
        userId,
        status: "sent",
      },
      data: {
        status: "opened",
        openedAt: new Date(),
      },
    });

    // Also mark the in-app notification as read
    // (fcmMessageId isn't stored on the Notification model, so we can't link them directly.
    //  In a future iteration, store the log ID or message ID on the Notification model.)

    return NextResponse.json({
      success: true,
      updated: updated.count,
    });
  } catch (error) {
    console.error("mark-opened POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
