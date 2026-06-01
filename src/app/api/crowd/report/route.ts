import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REPORT_EXPIRY_HOURS = 2;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { barId, level } = body;

  if (!barId || !level) {
    return NextResponse.json(
      { error: "barId and level required" },
      { status: 400 },
    );
  }

  const validLevels = [
    "QUIET",
    "GETTING_BUSY",
    "BUSY",
    "PACKED",
    "AT_CAPACITY",
  ];
  if (!validLevels.includes(level)) {
    return NextResponse.json(
      { error: "Invalid crowd level" },
      { status: 400 },
    );
  }

  const recentReport = await prisma.crowdReport.findFirst({
    where: {
      barId,
      reportedBy: userId,
      reportedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });

  if (recentReport) {
    return NextResponse.json(
      { error: "Rate limited. Wait before reporting again." },
      { status: 429 },
    );
  }

  const report = await prisma.crowdReport.create({
    data: {
      barId,
      level,
      reportedBy: userId,
      expiresAt: new Date(
        Date.now() + REPORT_EXPIRY_HOURS * 60 * 60 * 1000,
      ),
    },
  });

  return NextResponse.json({
    id: report.id,
    level: report.level,
    expiresAt: report.expiresAt,
  });
}
