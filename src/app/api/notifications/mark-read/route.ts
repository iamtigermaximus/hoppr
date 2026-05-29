import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { id, all } = await req.json();

  if (all) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  } else if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  return NextResponse.json({ success: true });
}
