import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { id, all } = await req.json();

    if (all) {
      await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    } else if (id) {
      await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("notifications/mark-read POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
