import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;

    await prisma.eventParticipant.update({
      where: { userId_eventId: { userId: session.user.id, eventId } },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("chat/events/[eventId]/mark-read POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
