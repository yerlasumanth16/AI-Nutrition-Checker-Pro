import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Analyze API working" });
}

export async function POST(req: Request) {
  return NextResponse.json({ success: true });
}
