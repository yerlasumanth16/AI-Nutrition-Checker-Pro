import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Use /api/analyze/text or /api/analyze/image" }, { status: 400 });
}
