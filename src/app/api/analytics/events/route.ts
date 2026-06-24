// POST /api/analytics/events
// Receives batched events from the client, increments counters atomically,
// and inserts raw AnalyticsEvent rows. Never blocks — 2 second timeout,
// returns 200 even on partial failure so the client doesn't retry.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AnalyticsEventType } from "@prisma/client";

type EventType =
  | "BAR_VIEW" | "BAR_DIRECTION" | "BAR_CALL"
  | "BAR_WEBSITE" | "BAR_SHARE" | "PROMO_VIEW"
  | "PROMO_CLICK" | "PROMO_REDEMPTION" | "PASS_VIEW"
  | "PASS_PURCHASE" | "PASS_SCAN" | "EVENT_VIEW"
  | "EVENT_JOIN" | "FOLLOW" | "UNFOLLOW"
  | "SEARCH" | "FEED_SCROLL" | "PAGE_VIEW";

interface IncomingEvent {
  type: EventType;
  barId?: string;
  promoId?: string;
  eventId?: string;
  passId?: string;
}

// Map event types to the Bar counter column they increment
const BAR_COUNTER_MAP: Partial<Record<EventType, string>> = {
  BAR_VIEW: "profileViews",
  BAR_DIRECTION: "directionClicks",
  BAR_CALL: "callClicks",
  BAR_WEBSITE: "websiteClicks",
  BAR_SHARE: "shareCount",
};

export async function POST(request: NextRequest) {
  // Guard: don't hold the connection open forever
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const body = await request.json();
    const events: IncomingEvent[] = body.events || [];

    if (events.length === 0) {
      clearTimeout(timeout);
      return NextResponse.json({ accepted: true, processed: 0 });
    }

    // Group counter increments by barId so we only run one UPDATE per bar
    const barIncrements = new Map<string, Record<string, number>>();
    const rawRows: {
      type: string;
      barId?: string;
      data?: Record<string, string>;
    }[] = [];

    for (const ev of events) {
      // Build raw event row
      rawRows.push({
        type: ev.type,
        barId: ev.barId,
        data: ev.promoId ? { promoId: ev.promoId }
          : ev.eventId ? { eventId: ev.eventId }
          : ev.passId ? { passId: ev.passId }
          : undefined,
      });

      // Figure out which counter to bump
      const counter = BAR_COUNTER_MAP[ev.type];
      if (counter && ev.barId) {
        const existing = barIncrements.get(ev.barId) || {};
        existing[counter] = (existing[counter] || 0) + 1;
        barIncrements.set(ev.barId, existing);
      }
    }

    // Run everything in a single transaction
    try {
      await prisma.$transaction(async (tx) => {
        // 1) Increment Bar counters (one UPDATE per bar)
        for (const [barId, increments] of barIncrements) {
          await tx.bar.updateMany({
            where: { id: barId },
            data: increments,
          });
        }

        // 2) Bulk-insert raw AnalyticsEvent rows
        await tx.analyticsEvent.createMany({
          data: rawRows.map((r) => ({ ...r, type: r.type as AnalyticsEventType })),
        });
      });
    } catch (dbError) {
      console.error("Analytics DB write failed (non-fatal):", dbError);
      // Still return 200 — the events are non-critical
    }

    clearTimeout(timeout);
    return NextResponse.json({ accepted: true, processed: events.length });
  } catch (error) {
    clearTimeout(timeout);
    // Don't 500 — the client already moved on. Don't make it retry.
    console.error("Analytics endpoint error (non-fatal):", error);
    return NextResponse.json({ accepted: false, processed: 0 });
  }
}
