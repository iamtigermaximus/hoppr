import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = jwt.sign(
    { sub: (session.user as any).id, email: session.user.email },
    process.env.JWT_SECRET || "change-me",
    { expiresIn: "24h" }
  );

  return NextResponse.json({ token });
}
