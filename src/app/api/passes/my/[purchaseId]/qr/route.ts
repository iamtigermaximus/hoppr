import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const QR_SECRET = process.env.JWT_SECRET!;
if (!QR_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not set. QR code generation cannot function without it.",
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ purchaseId: string }> }) {
  try {
    const { purchaseId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const purchase = await prisma.userVIPPass.findUnique({ where: { id: purchaseId } });
    if (!purchase || purchase.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (purchase.status === "USED" || purchase.scannedAt) {
      return NextResponse.json({ error: "Already redeemed" }, { status: 410 });
    }

    // Generate a time-based QR code that refreshes every 60 seconds
    const epoch = Math.floor(Date.now() / 60000); // 60-second window
    const qrData = `${purchase.id}:${purchase.qrCode}:${epoch}`;
    const hash = crypto.createHmac("sha256", QR_SECRET).update(qrData).digest("hex");

    return NextResponse.json({ qrData: `${purchase.id}:${epoch}:${hash.slice(0, 16)}` });
  } catch (error) {
    console.error("passes/my/[purchaseId]/qr GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
