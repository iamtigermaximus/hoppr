import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to claim a venue" },
        { status: 401 },
      );
    }

    const { id: barId } = await params;

    // Check the bar exists
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { id: true, name: true, isVerified: true, status: true },
    });

    if (!bar) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    if (bar.isVerified || bar.status === "VERIFIED") {
      return NextResponse.json(
        { error: "This venue is already verified" },
        { status: 409 },
      );
    }

    // Check if user already has a pending claim for this bar
    const existingClaim = await prisma.barClaim.findFirst({
      where: {
        barId,
        userId,
        status: "CLAIMED",
      },
    });

    if (existingClaim) {
      return NextResponse.json({
        success: true,
        claim: { id: existingClaim.id, status: existingClaim.status },
        message:
          "You already have a pending claim for this venue. An admin will reach out soon.",
      });
    }

    const body = await req.json();
    const { notes, phone, role } = body;

    // Create the claim
    const claim = await prisma.barClaim.create({
      data: {
        barId,
        userId,
        notes: [phone ? `Phone: ${phone}` : null, role ? `Role: ${role}` : null, notes]
          .filter(Boolean)
          .join("\n"),
        status: "CLAIMED",
      },
    });

    return NextResponse.json({
      success: true,
      claim: { id: claim.id, status: claim.status },
      message:
        "Claim request submitted. A hoppr admin will reach out to verify your ownership.",
    });
  } catch (error) {
    console.error("Claim venue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
