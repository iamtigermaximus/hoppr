/**
 * POST /api/promotions/activate
 *
 * Activates a promotion for redemption. Creates a PromotionActivation record
 * with a 30-second window. Enforces redemption rules (ONCE_PER_DAY etc.)
 * by checking prior activations.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Sign in to redeem this offer" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { promotionId, barId } = await req.json();

    if (!promotionId || !barId) {
      return NextResponse.json(
        { error: "promotionId and barId are required" },
        { status: 400 },
      );
    }

    // Fetch the promotion with full rules
    const promotion = await prisma.barPromotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion || !promotion.isActive || !promotion.isApproved) {
      return NextResponse.json(
        { error: "This offer is no longer available" },
        { status: 404 },
      );
    }

    // Check date validity (endDate may be null = permanent promotion)
    const now = new Date();
    if (now < promotion.startDate || (promotion.endDate && now > promotion.endDate)) {
      return NextResponse.json(
        { error: "This offer is not currently valid" },
        { status: 400 },
      );
    }

    // Check day of week
    const dayNames = [
      "sunday", "monday", "tuesday", "wednesday",
      "thursday", "friday", "saturday",
    ];
    const today = dayNames[now.getDay()];
    if (
      promotion.validDays.length > 0 &&
      !promotion.validDays.map((d) => d.toLowerCase()).includes(today)
    ) {
      const validDaysStr = promotion.validDays.join(", ");
      return NextResponse.json(
        { error: `This offer is only valid on: ${validDaysStr}` },
        { status: 400 },
      );
    }

    // Check time window (validHours is JSON like [{ open: "18:00", close: "21:00" }])
    if (promotion.validHours) {
      const hours = promotion.validHours as { open: string; close: string }[];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const inWindow = hours.some((h) => {
        const [oh, om] = h.open.split(":").map(Number);
        const [ch, cm] = h.close.split(":").map(Number);
        const openMin = oh * 60 + om;
        const closeMin = ch * 60 + cm;
        return currentMinutes >= openMin && currentMinutes <= closeMin;
      });

      if (!inWindow) {
        return NextResponse.json(
          { error: "This offer is not available at this time" },
          { status: 400 },
        );
      }
    }

    // Check max redemptions limit
    if (promotion.maxRedemptions) {
      if (promotion.redemptions >= promotion.maxRedemptions) {
        return NextResponse.json(
          { error: "All offers have been claimed" },
          { status: 400 },
        );
      }
    }

    // Enforce redemption rule
    if (promotion.redemptionRule === "SINGLE_USE") {
      const existing = await prisma.promotionActivation.findFirst({
        where: { promotionId, userId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "You've already used this offer" },
          { status: 400 },
        );
      }
    }

    if (promotion.redemptionRule === "ONCE_PER_DAY") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const existing = await prisma.promotionActivation.findFirst({
        where: {
          promotionId,
          userId,
          activatedAt: { gte: todayStart },
        },
      });
      if (existing) {
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const timeStr = tomorrow.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        return NextResponse.json(
          { error: `Already used today. Available again tomorrow at ${timeStr}` },
          { status: 400 },
        );
      }
    }

    // Create activation — 30-second window
    const expiresAt = new Date(now.getTime() + 30_000);

    const activation = await prisma.promotionActivation.create({
      data: {
        promotionId,
        userId,
        barId,
        status: "activated",
        activatedAt: now,
        expiresAt,
      },
    });

    // Increment the redemption counter
    await prisma.barPromotion.update({
      where: { id: promotionId },
      data: { redemptions: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      activationId: activation.id,
      expiresAt: expiresAt.toISOString(),
      message: "Show this screen to your bartender",
    });
  } catch (error) {
    console.error("promotions activate error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
