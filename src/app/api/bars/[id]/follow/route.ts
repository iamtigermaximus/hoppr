import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — follow a bar
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const { id: barId } = await params;

  // Verify bar exists
  const bar = await prisma.bar.findUnique({
    where: { id: barId },
    select: { id: true },
  });
  if (!bar) {
    return NextResponse.json({ error: "Bar not found" }, { status: 404 });
  }

  // Upsert: create follow if not exists (idempotent)
  const follow = await prisma.barFollow.upsert({
    where: {
      userId_barId: { userId, barId },
    },
    create: { userId, barId },
    update: {}, // no-op if already following
  });

  return NextResponse.json({
    success: true,
    following: true,
    follow,
  });
}

// DELETE — unfollow a bar
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const { id: barId } = await params;

  try {
    await prisma.barFollow.delete({
      where: {
        userId_barId: { userId, barId },
      },
    });

    return NextResponse.json({
      success: true,
      following: false,
    });
  } catch {
    // Already not following — idempotent
    return NextResponse.json({
      success: true,
      following: false,
    });
  }
}

// GET — check follow status for current user
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const { id: barId } = await params;

  // Count total followers (always public)
  const followerCount = await prisma.barFollow.count({
    where: { barId },
  });

  // Check if current user follows (if authenticated)
  let isFollowing = false;
  if (session?.user) {
    const userId = (session.user as Record<string, unknown>).id as string;
    const follow = await prisma.barFollow.findUnique({
      where: {
        userId_barId: { userId, barId },
      },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({
    followerCount,
    isFollowing,
  });
}
