import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Step 1: Auth
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = (session?.user as Record<string, unknown>)?.email as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to claim a venue", step: "auth" },
        { status: 401 },
      );
    }

    const { id: barId } = await params;

    // Step 2: Check bar exists
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { id: true, name: true, isVerified: true, status: true },
    });

    if (!bar) {
      return NextResponse.json({ error: "Venue not found", step: "bar-lookup", barId }, { status: 404 });
    }

    if (bar.isVerified || bar.status === "VERIFIED") {
      return NextResponse.json(
        { error: "This venue is already verified", step: "verified-check" },
        { status: 409 },
      );
    }

    // Step 3: Check for duplicate claim
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
        step: "duplicate",
        claim: { id: existingClaim.id, status: existingClaim.status },
        message:
          "You already have a pending claim for this venue. An admin will reach out soon.",
      });
    }

    const body = await req.json();
    const { name, email, notes, phone, role, documentUrls } = body;

    // Build structured contact summary for admin review
    const contactEmail = email || userEmail;
    const contactParts: string[] = [];
    if (name) contactParts.push(`Contact name: ${name}`);
    if (contactEmail) contactParts.push(`Email: ${contactEmail}`);
    if (role) contactParts.push(`Role: ${role}`);
    if (phone) contactParts.push(`Phone: ${phone}`);
    if (userEmail && email && email !== userEmail) {
      contactParts.push(`Account email: ${userEmail}`);
    }
    if (notes) contactParts.push(`Notes: ${notes}`);

    // Step 4: Create the claim and update bar status in a transaction
    const [claim] = await prisma.$transaction([
      prisma.barClaim.create({
        data: {
          barId,
          userId,
          notes: contactParts.join("\n") || null,
          documentUrls: Array.isArray(documentUrls) ? documentUrls : [],
          status: "CLAIMED",
        },
      }),
      // Update bar status to CLAIMED so it shows correctly in admin
      prisma.bar.update({
        where: { id: barId, status: "UNCLAIMED" },
        data: { status: "CLAIMED" },
      }),
    ]);

    // Step 5: Verify write
    const verified = await prisma.barClaim.findUnique({
      where: { id: claim.id },
      select: { id: true, status: true, documentUrls: true, notes: true, createdAt: true },
    });

    return NextResponse.json({
      success: true,
      step: "created",
      claim: { id: claim.id, status: claim.status, barId, userId },
      verified: !!verified,
      message:
        "Claim request submitted. A hoppr admin will reach out to verify your ownership.",
    });
  } catch (error) {
    console.error("Claim venue error:", error);
    // Return the real error in dev so we can debug
    const message = error instanceof Error ? error.message : "Internal server error";
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: message, stack: process.env.NODE_ENV !== "production" ? stack : undefined },
      { status: 500 },
    );
  }
}
