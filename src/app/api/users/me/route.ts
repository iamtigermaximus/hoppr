import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, bio: true, image: true,
        phoneNumber: true, drinkPrefs: true, interests: true, languages: true,
        instagram: true, facebook: true, twitter: true, gallery: true, createdAt: true,
        onboardingCompleted: true, activatedAt: true, claimNotificationsEnabled: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("users/me GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const data = await req.json();
    const allowed = ["username", "bio", "image", "drinkPrefs", "interests", "languages", "instagram", "facebook", "twitter", "phoneNumber", "gallery", "onboardingCompleted", "activatedAt", "claimNotificationsEnabled"];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    const user = await prisma.user.update({ where: { id: userId }, data: updateData });
    return NextResponse.json(user);
  } catch (error) {
    console.error("users/me PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
