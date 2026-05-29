import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // In production, this would call the real Marketing Tool to mark a pass as redeemed
  return NextResponse.json({ success: true, message: `Pass ${id} redeemed` });
}
