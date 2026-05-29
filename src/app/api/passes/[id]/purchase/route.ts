import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mockPasses, mockVenues } from "@/lib/marketing-api";
import crypto from "crypto";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const pass = mockPasses.find(p => p.id === params.id);
  if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });

  const venue = mockVenues.find(v => v.id === pass.venueId);
  const qrCodeSecret = crypto.randomBytes(32).toString("hex");

  const purchase = await prisma.passPurchase.create({
    data: {
      passId: pass.id,
      passTitle: pass.title,
      venueId: pass.venueId,
      venueName: pass.venueName,
      price: pass.price,
      validUntil: new Date(pass.validUntil),
      qrCodeSecret,
      userId,
    },
  });

  return NextResponse.json(purchase, { status: 201 });
}
