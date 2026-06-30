// POST   /api/notifications/devices — register a device for push notifications
// DELETE /api/notifications/devices — unregister a device (by fcmToken in body)
//
// Called by the consumer app after Firebase permission is granted.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — register device
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await request.json();
    const { fcmToken, platform, deviceName, locale, timezone } = body;

    if (!fcmToken || typeof fcmToken !== "string") {
      return NextResponse.json(
        { error: "fcmToken is required" },
        { status: 400 },
      );
    }

    // Deactivate any old tokens for this same device string (FCM tokens
    // can change, so we want the latest one active)
    // Upsert: create or update — one active token per device string
    const device = await prisma.notificationDevice.upsert({
      where: { fcmToken },
      create: {
        userId,
        fcmToken,
        platform: platform || "web",
        deviceName: deviceName || null,
        locale: locale || null,
        timezone: timezone || null,
        isActive: true,
        lastActiveAt: new Date(),
      },
      update: {
        userId, // Reassign in case token was re-used by another user
        platform: platform || "web",
        deviceName: deviceName || undefined,
        locale: locale || undefined,
        timezone: timezone || undefined,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, deviceId: device.id });
  } catch (error) {
    console.error("notifications/devices POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE — unregister device
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await request.json();
    const { fcmToken } = body;

    if (!fcmToken) {
      return NextResponse.json(
        { error: "fcmToken is required" },
        { status: 400 },
      );
    }

    // Soft-delete: mark inactive rather than removing the record
    // This preserves the history for analytics
    await prisma.notificationDevice.updateMany({
      where: { fcmToken, userId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("notifications/devices DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
