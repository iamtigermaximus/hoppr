import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { roomId: params.roomId },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages.map(m => ({
    id: m.id,
    content: m.content,
    author: { id: m.author.id, username: m.author.username, image: m.author.avatarUrl },
    createdAt: m.createdAt,
  })));
}
