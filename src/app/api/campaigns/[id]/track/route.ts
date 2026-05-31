import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const action: "impression" | "click" = body.action;

  if (action !== "impression" && action !== "click") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const campaign = await prisma.adCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.adCampaign.update({
    where: { id },
    data:
      action === "impression"
        ? { impressions: { increment: 1 } }
        : { clicks: { increment: 1 } },
    select: { id: true, impressions: true, clicks: true },
  });

  return NextResponse.json({ success: true, ...updated });
}
