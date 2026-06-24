import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/utils";

const WEIGHTS = {
  CROWD_REPORT: 0.25,
  EVENT_ATTENDEES: 0.30,
  VIP_SCANS: 0.25,
  FOLLOWERS: 0.20,
};

const CROWD_LEVEL_VALUE: Record<string, number> = {
  QUIET: 0.1,
  GETTING_BUSY: 0.35,
  BUSY: 0.6,
  PACKED: 0.85,
  AT_CAPACITY: 1.0,
};

const MAX_EXPECTED_ATTENDEES = 200;
const MAX_EXPECTED_SCANS = 50;
const MAX_EXPECTED_FOLLOWERS = 500;

function normalize(value: number, max: number): number {
  return Math.min(value / max, 1.0);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userLat = parseFloat(searchParams.get("lat") || "60.1699");
    const userLng = parseFloat(searchParams.get("lng") || "24.9384");

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const bars = await prisma.bar.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        crowdReports: {
          where: { expiresAt: { gte: new Date() } },
          orderBy: { reportedAt: "desc" },
          take: 1,
          select: { level: true, reportedAt: true, expiresAt: true },
        },
        events: {
          where: {
            startTime: { lte: new Date(Date.now() + 4 * 60 * 60 * 1000) },
            endTime: { gte: new Date() },
          },
          select: {
            id: true,
            _count: { select: { participants: true } },
          },
        },
        vipPassScans: {
          where: { scannedAt: { gte: twoHoursAgo } },
          select: { id: true },
        },
        _count: { select: { followers: true } },
      },
    });

    const scores = bars.map((bar) => {
      const latestReport = bar.crowdReports[0];
      const crowdReportScore = latestReport
        ? CROWD_LEVEL_VALUE[latestReport.level] ?? 0
        : 0;
      const weightedCrowdReport = crowdReportScore * WEIGHTS.CROWD_REPORT;

      const totalAttendees = bar.events.reduce(
        (sum, e) => sum + e._count.participants,
        0,
      );
      const eventScore = normalize(totalAttendees, MAX_EXPECTED_ATTENDEES);
      const weightedEvent = eventScore * WEIGHTS.EVENT_ATTENDEES;

      const scanCount = bar.vipPassScans.length;
      const scanScore = normalize(scanCount, MAX_EXPECTED_SCANS);
      const weightedScan = scanScore * WEIGHTS.VIP_SCANS;

      const followerCount = bar._count.followers;
      const followerScore = normalize(followerCount, MAX_EXPECTED_FOLLOWERS);
      const weightedFollower = followerScore * WEIGHTS.FOLLOWERS;

      const compositeScore =
        weightedCrowdReport + weightedEvent + weightedScan + weightedFollower;

      let computedLevel: string | null = null;
      if (compositeScore > 0) {
        if (compositeScore >= 0.75) computedLevel = "AT_CAPACITY";
        else if (compositeScore >= 0.55) computedLevel = "PACKED";
        else if (compositeScore >= 0.30) computedLevel = "BUSY";
        else if (compositeScore >= 0.10) computedLevel = "GETTING_BUSY";
        else computedLevel = "QUIET";
      }

      const distance = haversineDistance(
        userLat,
        userLng,
        bar.latitude!,
        bar.longitude!,
      );

      return {
        id: bar.id,
        name: bar.name,
        type: bar.type,
        lat: bar.latitude,
        lng: bar.longitude,
        district: bar.district,
        distance: Math.round(distance * 10) / 10,
        compositeScore: Math.round(compositeScore * 100),
        computedLevel,
        signals: {
          crowdReport: {
            level: latestReport?.level ?? null,
            reportedAt: latestReport?.reportedAt?.toISOString() ?? null,
            score: Math.round(weightedCrowdReport * 100),
          },
          events: {
            activeEventCount: bar.events.length,
            totalAttendees,
            score: Math.round(weightedEvent * 100),
          },
          vipScans: {
            recentScanCount: scanCount,
            score: Math.round(weightedScan * 100),
          },
          followers: {
            count: followerCount,
            score: Math.round(weightedFollower * 100),
          },
        },
        crowdLevel: latestReport?.level ?? null,
        crowdReportedAt: latestReport?.reportedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json(scores);
  } catch (error) {
    console.error("crowd/scores GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
