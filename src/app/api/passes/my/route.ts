import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const purchases = await prisma.userVIPPass.findMany({
      where: { userId },
      include: {
        vipPass: { select: { name: true, type: true } },
        bar: { select: { name: true } },
      },
      orderBy: { purchasedAt: "desc" },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("passes/my GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
