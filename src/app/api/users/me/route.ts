import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, username: true, bio: true, avatarUrl: true,
      phoneNumber: true, drinkPrefs: true, interests: true, languages: true,
      instagram: true, facebook: true, twitter: true, gallery: true, createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const data = await req.json();
  const allowed = ["username", "bio", "avatarUrl", "drinkPrefs", "interests", "languages", "instagram", "facebook", "twitter", "phoneNumber", "gallery"];
  const updateData: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }

  const user = await prisma.user.update({ where: { id: userId }, data: updateData });
  return NextResponse.json(user);
}
