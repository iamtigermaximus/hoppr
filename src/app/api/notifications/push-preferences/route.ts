// GET   /api/notifications/push-preferences — get user push notification preferences
// PATCH /api/notifications/push-preferences — update preferences
//
// Preferences are stored as JSON on the User model (pushPreferences field).
// Shape: { promoAlerts, eventReminders, crowdReports, loyaltyOffers,
//          nearbyRecommendations, quietHoursStart, quietHoursEnd, maxPerDay }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface PushPreferences {
  promoAlerts: boolean;
  eventReminders: boolean;
  crowdReports: boolean;
  loyaltyOffers: boolean;
  nearbyRecommendations: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
  maxPerDay: number; // 1-10
}

const DEFAULT_PREFERENCES: PushPreferences = {
  promoAlerts: true,
  eventReminders: true,
  crowdReports: true,
  loyaltyOffers: true,
  nearbyRecommendations: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  maxPerDay: 3,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushPreferences: true },
    });

    const prefs = (user?.pushPreferences as PushPreferences | null) || DEFAULT_PREFERENCES;
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("push-preferences GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();

    // Get current preferences, merge with updates
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushPreferences: true },
    });

    const current = (user?.pushPreferences as PushPreferences | null) || DEFAULT_PREFERENCES;
    const updated: PushPreferences = {
      ...current,
      ...body,
      // Validate maxPerDay range
      maxPerDay: Math.min(Math.max(body.maxPerDay ?? current.maxPerDay, 1), 10),
    };

    await prisma.user.update({
      where: { id: userId },
      data: { pushPreferences: updated as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("push-preferences PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
