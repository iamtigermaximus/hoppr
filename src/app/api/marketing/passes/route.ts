import { NextResponse } from "next/server";
import { mockPasses } from "@/lib/marketing-api";

export async function GET() {
  return NextResponse.json(mockPasses);
}
