import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import crypto from "crypto";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const rateCheck = checkRateLimit(`purchase:${userId}`, RateLimits.PURCHASE);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many purchases. Slow down." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
      );
    }

    // Look up the VIP pass from the database
    const vipPass = await prisma.vIPPassEnhanced.findUnique({
      where: { id },
      select: { id: true, name: true, barId: true, priceCents: true, validityEnd: true, maxPerUser: true },
    });

    if (!vipPass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });

    // Check max per user limit
    const existingCount = await prisma.userVIPPass.count({
      where: { userId, vipPassId: vipPass.id, status: "ACTIVE" },
    });
    if (existingCount >= vipPass.maxPerUser) {
      return NextResponse.json({ error: "You've reached the maximum purchases for this pass" }, { status: 400 });
    }

    const qrCode = crypto.randomBytes(32).toString("hex");

    const purchase = await prisma.userVIPPass.create({
      data: {
        vipPassId: vipPass.id,
        barId: vipPass.barId,
        purchasePriceCents: vipPass.priceCents,
        expiresAt: new Date(vipPass.validityEnd),
        qrCode,
        userId,
      },
      include: {
        vipPass: { select: { name: true, type: true } },
        bar: { select: { name: true } },
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("passes/[id]/purchase POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
