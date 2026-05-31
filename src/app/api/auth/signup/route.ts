import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, username, password } = await req.json();
  if (!email || !username || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Rate limit by IP + email to prevent account creation abuse
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = `signup:${ip}`;
  const rateCheck = checkRateLimit(rateKey, RateLimits.AUTH);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, hashedPassword },
  });
  return NextResponse.json({ id: user.id, email: user.email, username: user.username }, { status: 201 });
}
