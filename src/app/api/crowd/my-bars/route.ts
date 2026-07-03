import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface MyBarEntry {
  barId: string;
  barName: string;
  barType: string;
  relevance: "event" | "pass" | "followed";
  label: string;
  eventId?: string;
  eventTitle?: string;
  eventStartTime?: string;
  passName?: string;
  passExpiresAt?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results: MyBarEntry[] = [];
    const seenBarIds = new Set<string>();

    // Bars where user has upcoming events they've joined
    const upcomingEvents = await prisma.eventParticipant.findMany({
      where: {
        userId,
        event: {
          startTime: { gte: now },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            venueId: true,
            venue: { select: { name: true, type: true, latitude: true, longitude: true } },
          },
        },
      },
      orderBy: { event: { startTime: "asc" } },
      take: 10,
    });

    for (const ep of upcomingEvents) {
      if (seenBarIds.has(ep.event.venueId)) continue;
      if (ep.event.venue?.latitude && ep.event.venue?.longitude) {
        seenBarIds.add(ep.event.venueId);
        results.push({
          barId: ep.event.venueId,
          barName: ep.event.venue.name,
          barType: ep.event.venue.type,
          relevance: "event",
          label: `Your event: ${ep.event.title}`,
          eventId: ep.event.id,
          eventTitle: ep.event.title,
          eventStartTime: ep.event.startTime.toISOString(),
        });
      }
    }

    // Bars where user has active VIP passes
    const activePasses = await prisma.userVIPPass.findMany({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gte: now },
        bar: { latitude: { not: null }, longitude: { not: null } },
      },
      include: {
        vipPass: { select: { name: true } },
        bar: { select: { name: true, type: true, latitude: true, longitude: true } },
      },
      orderBy: { expiresAt: "asc" },
      take: 10,
    });

    for (const p of activePasses) {
      if (seenBarIds.has(p.barId!)) continue;
      if (p.bar?.latitude && p.bar?.longitude) {
        seenBarIds.add(p.barId!);
        results.push({
          barId: p.barId!,
          barName: p.bar.name,
          barType: p.bar.type,
          relevance: "pass",
          label: `Your pass: ${p.vipPass.name}`,
          passName: p.vipPass.name,
          passExpiresAt: p.expiresAt.toISOString(),
        });
      }
    }

    // Bars user follows (only if not already covered by events/passes)
    const followedBars = await prisma.barFollow.findMany({
      where: {
        userId,
        bar: { latitude: { not: null }, longitude: { not: null } },
      },
      include: {
        bar: { select: { name: true, type: true, latitude: true, longitude: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const fb of followedBars) {
      if (seenBarIds.has(fb.barId)) continue;
      if (fb.bar.latitude && fb.bar.longitude) {
        seenBarIds.add(fb.barId);
        results.push({
          barId: fb.barId,
          barName: fb.bar.name,
          barType: fb.bar.type,
          relevance: "followed",
          label: `You follow ${fb.bar.name}`,
        });
      }
    }

    return NextResponse.json({ bars: results });
  } catch (error) {
    console.error("crowd/my-bars GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
