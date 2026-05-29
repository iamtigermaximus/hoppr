import { NextResponse } from "next/server";
import { mockPromotions } from "@/lib/marketing-api";

export async function GET() {
  return NextResponse.json(mockPromotions);
}
